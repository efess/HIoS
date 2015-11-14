using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TestSerial
{
    public class ProvisionUpdate
    {
        public byte[] SSID { get; set; }
        public byte[] Password { get; set; }
        public byte[] ID { get; set; }

        public byte[] Host { get; set; }
        public UInt16 Port { get; set; }
    }
}
