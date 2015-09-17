using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TestSerial
{
    public class ProvisionInfo
    {
        public bool IsValid { get; private set; }
        public string ID { get; private set; }
        public string Device { get; private set; }
        public byte[] SSID { get; private set; }
        public WifiAp[] AvailableAps { get; private set; }
        //AU Sends id         (type-<serial# if provisioning has occured in the past>)\r\n
        //AU Sends ssid       something\r\n
        //AU Sends            aplist\r\n
        //AU Sends            <dump of list from ESP>
        //AU Sends            done\r\n

        //+CWLAP:(3,"Asus_Joes",-44,"74:d0:2b:5f:54:a8",6,26)
        //+CWLAP:(4,"Gaedeclarke95",-81,"0c:54:a5:d3:0a:98",6,26)
        //+CWLAP:(0,"xfinitywifi",-82,"0c:54:a5:d3:0a:9a",6,25)
        public ProvisionInfo(byte[] data)
        {
            Parse(data);
        }

        private void Parse(byte[] data)
        {
            int offset = 0;

            var provisionInfo = ByteHelper.GetTerminatedByte(data, offset, ByteHelper.CRLF_TERM);
            offset += provisionInfo.Length;
            if (provisionInfo == null)
            {
                IsValid = false;
                return;
            }

            if(Encoding.UTF8.GetString(ByteHelper.GetSubArray(provisionInfo, 0, provisionInfo.Length - 2))
                != "provisioninfo")
            {
                IsValid = false;
                return;
            }

            var id = ByteHelper.GetTerminatedByte(data, offset, ByteHelper.CRLF_TERM);
            offset += id.Length;
            if(id == null)
            {
                IsValid = false;
                return;
            }

            ID = Encoding.UTF8.GetString(ByteHelper.GetSubArray(id, 0, id.Length - 2));

            var device = ByteHelper.GetTerminatedByte(data, offset, ByteHelper.CRLF_TERM);
            offset += device.Length;
            if (device == null)
            {
                IsValid = false;
                return;
            }

            Device = Encoding.UTF8.GetString(ByteHelper.GetSubArray(device, 0, device.Length - 2));

            var ssid = ByteHelper.GetTerminatedByte(data, offset, ByteHelper.CRLF_TERM);
            offset += ssid.Length;
            if (ssid == null)
            {
                IsValid = false;
                return;
            }

            SSID = ByteHelper.GetSubArray(ssid, 0, ssid.Length - 2);

            var aplist = ByteHelper.GetTerminatedByte(data, offset, ByteHelper.CRLF_TERM);
            offset += aplist.Length;
            if (aplist == null)
            {
                IsValid = false;
                return;
            }

            List<WifiAp> listOfAps = new List<WifiAp>();
            byte[] cwlap = null;
            while((cwlap = ByteHelper.GetTerminatedByte(data, offset, ByteHelper.CRLF_TERM)).Length >= 4
                && cwlap[0] != 'O' && cwlap[1] != 'K')
            {
                offset += cwlap.Length;
                if (cwlap == null)
                {
                    IsValid = false;
                    return;
                }

                if(cwlap[0] == '+' 
                    && cwlap[1] == 'C'
                    && cwlap[2] == 'W'
                    && cwlap[3] == 'L'
                    && cwlap[4] == 'A'
                    && cwlap[5] == 'P')
                {
                    var wifiAp = new WifiAp(cwlap);
                    if (wifiAp.IsValid)
                    {
                        listOfAps.Add(wifiAp);
                    }
                }
            }
            AvailableAps = listOfAps.ToArray();

            var done = ByteHelper.GetTerminatedByte(data, offset, ByteHelper.CRLF_TERM);
            offset += done.Length;
            if (done == null)
            {
                IsValid = false;
                return;
            }

            IsValid = true;
        }
    }
}
