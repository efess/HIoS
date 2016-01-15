using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO.Ports;

namespace test_lights
{
    public partial class Form1 : Form
    {
        private System.IO.Ports.SerialPort serial;
        public Form1()
        {
            InitializeComponent();
            try
            {
                serial = new System.IO.Ports.SerialPort("COM10", 115200);
                serial.Open();
            }
            catch (Exception e)
            {
                Application.Exit();
            }

        }

        private void button1_Click(object sender, EventArgs e)
        {
            // 1 Byte 98
            // 2 Byte length
            // 3 Byte what? (0 - options, 1 - pallete)
            // 4 - 8 Color
            // 5 - 12 Options
            var valueToSend = (uint)numericUpDown4.Value; //tran

            valueToSend <<= 3;
            valueToSend = valueToSend | (uint)numericUpDown6.Value; //anim

            valueToSend <<= 4;
            valueToSend = valueToSend | (uint)numericUpDown5.Value; //bright

            valueToSend <<= 2;
            valueToSend = valueToSend | (uint)numericUpDown3.Value; //tran

            valueToSend <<= 3;
            valueToSend = valueToSend | (uint)numericUpDown1.Value; //anim

            valueToSend <<= 4;
            valueToSend = valueToSend | (uint)numericUpDown2.Value; //bright

            valueToSend <<= 1;
            valueToSend = valueToSend | (uint)(radioButton1.Checked ? 1 : 0); //occ

            led_send send;
            send.control = 98;
            send.what = 0; 
            send.color = 0x00FFFFFF;
            send.options = valueToSend;
            serial.ReadTimeout = 2000;
            var sendArr = marshall(send);
            serial.Write(sendArr, 0, sendArr.Length);
            System.Threading.Thread.Sleep(300);
            int readByte = serial.ReadByte();
            if (readByte == 98)
            {
                MessageBox.Show("SUCCESS " + readByte);
            }
            else
            {
                MessageBox.Show("FAIL " + readByte);
            }
        }
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        struct led_send
        {
            public byte control;
            public byte what;
            public uint color;
            public uint options;
        }

        public byte[] marshall<T>(T obj) where T : struct 
        {
            int size = Marshal.SizeOf(obj.GetType());
            byte[] arr = new byte[size];

            IntPtr ptr = Marshal.AllocHGlobal(size);
            Marshal.StructureToPtr(obj, ptr, true);
            Marshal.Copy(ptr, arr, 0, size);
            Marshal.FreeHGlobal(ptr);
            return arr;
        }

        private void button3_Click(object sender, EventArgs e)
        {
            sendPallete(new uint[]{
                0x5500AB, 0x84007C, 0xB5004B, 0xE5001B,
                0xE81700, 0xB84700, 0xAB7700, 0xABAB00,
                0xAB5500, 0xDD2200, 0xF2000E, 0xC2003E,
                0x8F0071, 0x5F00A1, 0x2F00D0, 0x0007F9
            });
        }

        private void sendPallete(UInt32[] pallete)
        {
            led_pallete send;
            send.control = 98;
            send.what = 1;
            send.length = (byte)pallete.Length;
            send.colors = pallete;
            
            var sendArr = marshall(send);
            serial.Write(sendArr, 0, sendArr.Length);
            if (serial.ReadByte() == 98)
            {
                MessageBox.Show("SUCCESS");
            }
            else
            {
                MessageBox.Show("FAIL");
            }
        }

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        struct led_pallete
        {
            public byte control;
            public byte what;
            public byte length;
            [MarshalAs(UnmanagedType.ByValArray, ArraySubType = UnmanagedType.U4, SizeConst=16)] public uint[] colors;
        }

        private void button2_Click(object sender, EventArgs e)
        {
        }

        private void button2_Click_1(object sender, EventArgs e)
        {
            sendPallete(new uint[]{
                0xFF0000, 0x00FF00, 0xC5A436, 0xFFFFFF,
                0xFF0000, 0x00FF00, 0xC5A436, 0xFFFFFF,
                0xFF0000, 0x00FF00, 0xC5A436, 0xFFFFFF,
                0xFF0000, 0x00FF00, 0xC5A436, 0xFFFFFF
            });

            //sendPallete(new uint[]{
            //    0x992114, 0x1A3112, 0xC5A436, 0xFFFFFF,
            //    0x992114, 0x1A3112, 0xC5A436, 0xFFFFFF,
            //    0x992114, 0x1A3112, 0xC5A436, 0xFFFFFF,
            //    0x992114, 0x1A3112, 0xC5A436, 0xFFFFFF
            //});
        }
    }
}
