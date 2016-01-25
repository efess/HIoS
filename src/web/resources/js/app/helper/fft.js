var e = Math.E;
var pi = Math.PI;
var twoPi = Math.PI * 2;

var fft = {
    doFft: function(samples, length) {
    
        var twoPiDiv = twoPi / length;
        var fq = [];
        for(var k = 0; k < length; k++){
            for(var n = 0; n < length; n++) {
                var exp = -twoPiDiv * k * n;
                fq[k] = (fq[k] || 0) + samples[n] * Math.pow(e, exp);
            }
        } 
        
        return fq;
    }
}


module.exports = fft;