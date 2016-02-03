var e = Math.E;
var pi = Math.PI;
var twoPi = Math.PI * 2;

/*
basic complex number arithmetic from 
http://rosettacode.org/wiki/Fast_Fourier_transform#Scala
*/
function Complex(re, im) 
{
	this.re = re;
	this.im = im || 0.0;
}
Complex.prototype.add = function(other, dst)
{
	dst.re = this.re + other.re;
	dst.im = this.im + other.im;
	return dst;
}
Complex.prototype.sub = function(other, dst)
{
	dst.re = this.re - other.re;
	dst.im = this.im - other.im;
	return dst;
}
Complex.prototype.mul = function(other, dst)
{
	//cache re in case dst === this
	var r = this.re * other.re - this.im * other.im;
	dst.im = this.re * other.im + this.im * other.re;
	dst.re = r;
	return dst;
}
Complex.prototype.cexp = function(dst)
{
	var er = Math.exp(this.re);
	dst.re = er * Math.cos(this.im);
	dst.im = er * Math.sin(this.im);
	return dst;
}
Complex.prototype.log = function()
{
	/*
	although 'It's just a matter of separating out the real and imaginary parts of jw.' is not a helpful quote
	the actual formula I found here and the rest was just fiddling / testing and comparing with correct results.
	http://cboard.cprogramming.com/c-programming/89116-how-implement-complex-exponential-functions-c.html#post637921
	*/
	if( !this.re )
		console.log(this.im.toString()+'j');
	else if( this.im < 0 )
		console.log(this.re.toString()+this.im.toString()+'j');
	else
		console.log(this.re.toString()+'+'+this.im.toString()+'j');
}
	
var fft = {
    doFft: function(samples, length) {
        var twoPiDiv = twoPi / length;
        var fq = [];
        var cos = [];
        var sin = [];
        
        for(var k = 0; k < length / 2; k++) {
            for(var n = 0; n < length; n++) {
                var trigComp = -twoPiDiv * k * n;
                sin[k] = (sin[k] || 0) + samples[n] * Math.sin(trigComp);
                cos[k] = (cos[k] || 0) + samples[n] * Math.cos(trigComp);
            }
            fq[k] = Math.sqrt(Math.pow(sin[k], 2) + Math.pow(cos[k], 2));
        } 
        fq[0] = 0;
        return fq;
    },
    cfft: function (amplitudes) {
        var N = amplitudes.length;
        if( N <= 1 )
            return amplitudes;
    
        var hN = N / 2;
        var even = [];
        var odd = [];
        
        even.length = hN;
        odd.length = hN;
        
        for(var i = 0; i < hN; ++i)
        {
            even[i] = amplitudes[i*2];
            odd[i] = amplitudes[i*2+1];
        }
        even = fft.cfft(even);
        odd = fft.cfft(odd);
    
        var twiddle = -2*Math.PI;
        for(var k = 0; k < hN; ++k)
        {
            if(!(even[k] instanceof Complex))
                even[k] = new Complex(even[k], 0);
            if(!(odd[k] instanceof Complex))
                odd[k] = new Complex(odd[k], 0);
                
            var div = k/N;
            var t = new Complex(0, twiddle * div);
            
            t.cexp(t).mul(odd[k], t);
            
            amplitudes[k] =      even[k].add(t, odd[k]);
            amplitudes[k + hN] = even[k].sub(t, even[k]);
        }
        return amplitudes;
    },
    realFft: function(S, start, length, stride, X) {
        // X0,...,N−1 ← ditfft2(x, N, s):             DFT of (x0, xs, x2s, ..., x(N-1)s):
        // if N = 1 then
        //     X0 ← x0                                      trivial size-1 DFT base case
        // else
        //     X0,...,N/2−1 ← ditfft2(x, N/2, 2s)             DFT of (x0, x2s, x4s, ...)
        //     XN/2,...,N−1 ← ditfft2(x+s, N/2, 2s)           DFT of (xs, xs+2s, xs+4s, ...)
        //     for k = 0 to N/2−1                           combine DFTs of two halves into full DFT:
        //         t ← Xk
        //         Xk ← t + exp(−2πi k/N) Xk+N/2
        //         Xk+N/2 ← t − exp(−2πi k/N) Xk+N/2
        //     endfor
        // endif        
        if(length === 1) {
            X[start].re = S[start];
            X[start].im = S[start];
            return;
        }
        
        var negTwoPiDiv = -twoPi / length;
        var halfLen = length / 2;
        
        fft.realFft(S, start,           halfLen, stride * 2, X);
        fft.realFft(S, start + stride,  halfLen, stride * 2, X);
        
        for(var k = 0; k < halfLen; k++) {
            var shifted = (k * stride) + start;
            var t = X[shifted];
            var x1re = Math.sin(negTwoPiDiv * k) * X[shifted + halfLen].re;
            var x1im = Math.cos(negTwoPiDiv * k) * X[shifted + halfLen].im;
            
            // k00 = start + k*stride;    
            // k01 = k00 + halfLen*stride;
            
            // k10 = start + 2*k*stride;  
            // k11 = k10 + stride;
            
            // cs = cos(TWO_PI*k/(double)N); sn = sin(TWO_PI*k/(double)N);
            // tmp0 = cs * XX[k11][0] + sn * XX[k11][1];
            // tmp1 = cs * XX[k11][1] - sn * XX[k11][0];
            
            // X[k01][0] = XX[k10][0] - tmp0;
            // X[k01][1] = XX[k10][1] - tmp1;
            
            // X[k00][0] = XX[k10][0] + tmp0;
            //X[k00][1] = XX[k10][1] + tmp1
            
            X[shifted] = {
                re: t.re + x1re,
                im: t.im + x1im,
            };
            X[shifted + halfLen] = {
                re: t.re - x1re,
                im: t.im - x1im,
            };
        }
        return X;
    },
    OtherFft: function(S, start, length, stride) {
        
        // X0,...,N−1 ← ditfft2(x, N, s):             DFT of (x0, xs, x2s, ..., x(N-1)s):
        // if N = 1 then
        //     X0 ← x0                                      trivial size-1 DFT base case
        // else
        //     X0,...,N/2−1 ← ditfft2(x, N/2, 2s)             DFT of (x0, x2s, x4s, ...)
        //     XN/2,...,N−1 ← ditfft2(x+s, N/2, 2s)           DFT of (xs, xs+2s, xs+4s, ...)
        //     for k = 0 to N/2−1                           combine DFTs of two halves into full DFT:
        //         t ← Xk
        //         Xk ← t + exp(−2πi k/N) Xk+N/2
        //         Xk+N/2 ← t − exp(−2πi k/N) Xk+N/2
        //     endfor
        // endif
        
        if(length === 1) {
            return [{re: S[start], im :S[start]}];
        }
        
        var negTwoPiDiv = -twoPi / length;
        var halfLen = length / 2;
        
        var first = fft.realFft(S, start, halfLen, stride * 2);
        var second = fft.realFft(S, start + stride, halfLen, stride * 2);
        var X = [];
        
        for(var k = 0; k < halfLen; k++) {
            
            var t = first[k];
            
            x1re = Math.sin(negTwoPiDiv * k) * second[k].re;
            x1im = Math.cos(negTwoPiDiv * k) * second[k].im;
            
            X[k] = {
                re: (t.re || 0) + x1re,
                im: (t.im || 0) + x1im,
            };
            X[k + halfLen] = {
                re: (t.re || 0) - x1re,
                im: (t.im || 0) - x1im,
            };
        }
        return X;
    }
}


module.exports = fft;