using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TestSerial
{
    public class TimeoutOperation
    {
        private DateTime _timeoutAt;
        public TimeoutOperation(int ms)
        {
            _timeoutAt = DateTime.Now.AddMilliseconds(ms);
        }

        public bool CheckTimeout()
        {
            TimedOut = DateTime.Now > _timeoutAt;

            return TimedOut;
        }

        public bool TimedOut { get; private set; }
    }
}
