using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO.Ports;

namespace TestSerial
{
    public partial class Form1 : Form
    {
        private Provision _provision = null;
        private Serial _serial = null;
        private StringBuilder _readDisplay = null;
        private string _currentId = null;

        public Form1()
        {
            InitializeComponent();
            comboBox1.Items.AddRange(Serial.GetPorts());
            
            _readDisplay = new StringBuilder();

        }

        private void button3_Click(object sender, EventArgs ev)
        {
            ConnectSerial();
        }

        private void UpdateDisplay()
        {
            lock (_readDisplay)
            {
                textBox1.AppendText(_readDisplay.ToString());
                _readDisplay.Clear();
            }

        }

        private void ConnectSerial()
        {
            if (_serial != null)
            {
                throw new Exception("Must handle exception");
            }

            _serial = new Serial(comboBox1.SelectedItem as string, 9600);
            _serial.DataRead += (s, e) =>
            {
                lock (_readDisplay)
                {
                    _readDisplay.Append(System.Text.Encoding.UTF8.GetString(e.ReadBytes));
                }
                this.Invoke((Action)UpdateDisplay);
            };

            _serial.PortError += (s, e) =>
            {
                lock (_readDisplay)
                {
                    _readDisplay.AppendLine("Exception on read: " + e.Exception.Message);
                }
                this.Invoke((Action)UpdateDisplay);
            };

            _serial.Open();
        }

        private void button4_Click(object sender, EventArgs e)
        {
            _serial.Close();
            _serial = null;
        }

        private void textBox3_KeyUp(object sender, KeyEventArgs e)
        {
            if(e.KeyData == Keys.Enter)
            {
                _serial.Write(textBox3.Text);
                textBox3.Text = string.Empty;
            }
        }

        private void button5_Click(object sender, EventArgs e)
        {
            _provision = new Provision(_serial);
            var info = _provision.Start();
            if (info == null || !info.IsValid)
                return;

            _currentId = info.ID;
            if (info.AvailableAps.Length > 0)
            {
                listBox1.Items.AddRange(info.AvailableAps);
                listBox1.DisplayMember = "SSIDString";
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            if (_currentId == null) // Never connected to device
                return;

            // send provision
            var wifiItem = listBox1.SelectedItem as WifiAp;
            if (wifiItem == null)
                return;

            var provisionUpdate = new ProvisionUpdate
            {
                ID = _currentId,
                Password = Encoding.UTF8.GetBytes(textBox2.Text),
                SSID = wifiItem.SSID
            };

            _provision.PushProvision(provisionUpdate);
        }
    }
}
