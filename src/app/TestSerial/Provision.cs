using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TestSerial
{

    /*
    Arduino boots right in Provision mode (no storage)
    - or - arduino loops checking serial for any received bytes in buffer

    PC Sends            initprovision\r\n
    PC waits for response
    
    AU receives         initprovision\r\n
    AU moves into Provision mode (if not already)
    AU Sends            provisioninfo\r\n
    AU Sends            id (type-<serial# if provisioning has occured in the past>)\r\n
    AU Sends ssid       something\r\n
    AU Sends            aplist\r\n
    AU Sends            <dump of list from ESP>
    AU Sends            done\r\n
    AU waits for response

    PC Sends            provision\r\n
    PC Sends            <provisioning data>\r\n
    PC Sends            done\r\n

    AU receives         provision\r\n
    AU receives provision information
    AU validate requied ID & SSID info
    ....
    
    AU Sends            missing-req <field>
    AU waits for response
        OR
    AU Sends            done\r\n
    AU stores information
    AU moves to loop

    */
    public class Provision : IDisposable
    {
        private const string TOKEN_DONE = "done\r\n";

        private Serial _serial;
        private Queue<byte[]> _recvBuffer;

        public Provision(Serial connection)
        {
            _recvBuffer = new Queue<byte[]>();
            _serial = connection;
            _serial.DataRead += ReceiveData;
        }

        public ProvisionInfo Start()
        {
            return GetInfo();
        }

        public async void PushProvision(ProvisionUpdate update)
        { 
            var provisionData = new byte[33 + 64 + 65 + 2];
            var offset = 0;
            Array.Copy(update.SSID, 0, provisionData, offset, update.SSID.Length);
            offset += 33;

            Array.Copy(update.Password, 0, provisionData, offset, update.Password.Length);
            offset += 64;

            var checkedId = CheckID(update.ID);
            Array.Copy(checkedId, 0, provisionData, offset, checkedId.Length);
            offset += 16;

            Array.Copy(update.Host, 0, provisionData, offset, update.Host.Length);
            offset += 16 + 1; // add 1 to account for structure padding?

            var byteArray = BitConverter.GetBytes(update.Port);
            Array.Copy(byteArray, 0, provisionData, offset, byteArray.Length);
            offset += byteArray.Length;

            provisionData[provisionData.Length - 2] = 0x0D;
            provisionData[provisionData.Length - 1] = 0x0A;

            await _serial.Write("provision" + char.MinValue+ "\r\n");
            await _serial.Write(provisionData);
            await _serial.Write(TOKEN_DONE);
        }

        private byte[] CheckID(byte[] ID)
        {
            return ID == null || ID.Length != 16 ? Guid.NewGuid().ToByteArray() : ID;
        }

        private ProvisionInfo RefreshWifi()
        {
            return GetInfo();
        }

        private ProvisionInfo GetInfo()
        {
            _serial.Write("initprovision" + Char.MinValue + "\r\n");

            // lets wait a bit.
            System.Threading.Thread.Sleep(1000);

            var memoryStream = new MemoryStream();
            var sb = new StringBuilder();   
            string currentString = "";

            var timeout = new TimeoutOperation(20000);
            
            while(!currentString.EndsWith(TOKEN_DONE) && !timeout.CheckTimeout())
            {
                while(_recvBuffer.Count > 0)
                {
                    var dataz = _recvBuffer.Dequeue();
                    memoryStream.Write(dataz, 0, dataz.Length);
                    sb.Append(Encoding.UTF8.GetString(dataz));
                }
                System.Windows.Forms.Application.DoEvents();
                currentString = sb.ToString();
            }
            
            return timeout.TimedOut ? null : new ProvisionInfo(memoryStream.ToArray());
        }

        private void ReceiveData(object sender, Serial.SerialReadEventArgs e)
        {
            _recvBuffer.Enqueue(e.ReadBytes);
        }
        
        public void Dispose()
        {
            if(_serial != null)
            {
                _serial.DataRead -= ReceiveData;
            }
        }
    }
}
