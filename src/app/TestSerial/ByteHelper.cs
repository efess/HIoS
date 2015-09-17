using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TestSerial
{
    public class ByteHelper
    {
        public static byte[] CRLF_TERM = new byte[2] { 0x0D, 0x0A };
        public static byte[] GetTerminatedByte(byte[] buffer, int offset, byte[] terminator)
        {
            bool foundTerminator = false;
            byte[] byteArray = null;
            int termLen = terminator.Length,
                i = 0, j = 0;
            for (i = offset; i < buffer.Length - termLen; i++)
            {
                for(j = 0; j < termLen; j++)
                {
                    foundTerminator = terminator[j] == buffer[i + j];
                    if (!foundTerminator)
                        break;
                }
                if(foundTerminator)
                {
                    var newLength = (i + termLen) - offset;
                    byteArray = new byte[newLength];

                    Array.Copy(buffer, offset, byteArray, 0, newLength);
                    break;
                }
            }

            return byteArray;
        }

        public static byte[] GetSubArray(byte[] buffer, int offset, int length)
        {
            if(offset + length > buffer.Length)
            {
                throw new IndexOutOfRangeException("Offset and Length are outside of the array");
            }

            byte[] array = new byte[length];
            Array.Copy(buffer, offset, array, 0, length);
            return array;
        }
    }
}
