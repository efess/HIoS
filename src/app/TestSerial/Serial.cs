using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.IO.Ports;

namespace TestSerial
{
    public class Serial
    {
        public EventHandler<SerialReadEventArgs> DataRead;
        public EventHandler<SerialErrorEventArgs> PortError;

        public static string[] GetPorts()
        {
            return SerialPort.GetPortNames();
        }

        private SerialPort _port = null;
        public Serial(string portName, int baud)
        {
            _port = new SerialPort(portName, baud);
            _port.DtrEnable = true;
        }

        public void Open()
        {
            _port.Open();
            ReadLoop();
        }

        public void Close()
        {
            _port.Close();
            _port = null;
        }

        public async Task Write(byte[] content)
        {
            byte[] buffer = new byte[64];
            var toWriteLength = content.Length;
            var offset = 0;

            while (offset < toWriteLength)
            {
                var currentLength = Math.Min(toWriteLength - offset, 64);

                Buffer.BlockCopy(content, offset, buffer, 0, currentLength);

                await _port.BaseStream.WriteAsync(buffer, 0, currentLength);

                offset = offset + currentLength;
                
                //System.Threading.Thread.Sleep(100); // sleep 100 ms
            }
        }

        public async Task Write(string content)
        {
            await Write(System.Text.Encoding.UTF8.GetBytes(content));
        }

        private async void ReadLoop()
        {
            while(_port != null)
            {
                byte[] result = new byte[1024];
                try
                {
                    int read = await _port.BaseStream.ReadAsync(result, 0, result.Length);
                    if(DataRead != null)
                    {
                        DataRead(this, new SerialReadEventArgs(result.Take(read).ToArray()));
                    }
                }
                catch (IOException ex)
                {
                    if(PortError != null)
                    {
                        PortError(this, new SerialErrorEventArgs(ex));
                    }
                }
            }
        }

        public class SerialReadEventArgs : EventArgs
        {
            public SerialReadEventArgs(byte[] readBytes)
            {
                ReadBytes = readBytes;
            }
            public byte[] ReadBytes { get; private set; }
        }
        public class SerialErrorEventArgs : EventArgs
        {
            public SerialErrorEventArgs(IOException ex)
            {
                Exception = ex;
            }
            public IOException Exception { get; private set; }
        }
    }
}
