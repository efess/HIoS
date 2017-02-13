var Promise = require('promise');

var currentTasks = [];
var runningTasks = []


function addTask(task) {
    currentTasks.push(task);
}

function execIntervalTask(runningTask) {
    var task = runningTask.task;
    runningTask.timerId = setTimeout(function() {
        task.fn(task.fnContext)
            .then(execIntervalTask.bind(null, runningTask));
    }, task.time);
}
function startTask(task) {
    var runningTask = {
        task: task,
        timerId: 0
    };
    
    if(task.timing === 'interval') {
        execIntervalTask(runningTask);
    }
    runningTasks.push(runningTask);
}

function startAll(){
    currentTasks.forEach(startTask);
}

module.exports = {
    addTask: addTask,
    startAll: startAll
}