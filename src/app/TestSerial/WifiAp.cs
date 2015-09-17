using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TestSerial
{
    //ecn,ssid,rssi,mac 
    // +CWLAP:(3,"Asus_Joes",-38,"74:d0:2b:5f:54:a8",6,0)
    public class WifiAp
    {
        public bool IsValid { get; private set;}
        public byte[] SSID { get; private set; }
        public string Mac { get; private set; }
        public int SignalStrength { get; private set; }

        public string SSIDString
        {
            get
            {
                return Encoding.UTF8.GetString(SSID);
            }
        }

        public WifiAp(byte[] data)
        {
            Parse(data);
        }

        private void Parse(byte[] data)
        {
            if (data.Length == 0)
            {
                IsValid = false;
                return; // Corrupt
            }
            
            int ssidStart = 0, ssidEnd = 0, c = 0;
            for(int i = 0; i < data.Length; i ++)
            {
                if (data[i] == '"') // first quote from the left...
                {
                    ssidStart = i;
                    break;
                }
            }
            for(int i = data.Length - 1; i >= 0; i--)
            {
                if (data[i] == '"')
                {
                    if(++c > 2)// 3rd quote from the right...
                    {
                        ssidEnd = i;
                        break;
                    }
                }
            }

            if(ssidEnd == 0 || ssidStart == 0)
            {
                IsValid = false;
                return; // Corrupt
            }

            byte[] ssid = new byte[ssidEnd - ssidStart - 1];
            byte[] array = new byte[data.Length - ssid.Length - 2];

            int s = 0, a = 0, o;
            for(o = 0; o < data.Length; o++)
            {
                if (o == ssidStart)
                {
                    continue;
                }
                if (o == ssidEnd)
                {
                    continue;
                }

                if(o > ssidStart && o < ssidEnd)
                {
                    ssid[s++] = data[o];
                }
                else
                {
                    array[a++] = data[o];
                }
            }

            SSID = ssid;

            var arrayStr = Encoding.UTF8.GetString(array);

            var parts = arrayStr.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            if(parts.Length < 2)
            {
                IsValid = false;
                return;
            }

            int signalParse = 0;
            if(int.TryParse(parts[1], out signalParse))
            {
                SignalStrength = signalParse;
            }
            IsValid = true;
        }
    }
}
