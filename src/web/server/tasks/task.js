var Promise = require('promise');

var currentTasks = [];
var runningTasks = []


function addTask(task) {
    currentTasks.push(task);
}

function execIntervalTask(runningTask) {
    var task = runningTask.task;
    runningTask.timerId = setTimeout(function() {
        var next = execIntervalTask.bind(null, runningTask);
        var p = task.fn(task.fnContext);
        
        if(p.then) {
            p.then(next, next);
        } else {
            next();
        }

    }, task.time);
}
function startTask(task) {
    var runningTask = {
        task: task,
        timerId: 0
    };
    
    if(task.timing === 'interval') {
        execIntervalTask(runningTask);
        task.fn(task.fnContext);
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