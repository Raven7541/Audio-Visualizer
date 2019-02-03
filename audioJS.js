// An IIFE ("Iffy") - see the notes in mycourses
	(function(){
		"use strict";
		
		var NUM_SAMPLES = 256;
		var SOUND_1 = 'Baroque Sea, Act I';   // The Ocean Hunter
        var SOUND_2 = 'Magician Theme';       // The House of the Dead
        var SOUND_3 = 'Wild Dog';             // Time Crisis 3
		var SOUND_4 = 'Grakata!';             // Joey Zero (Warframe)
		var audioElement;
		var analyserNode;
		var canvas,ctx;
        var maxRadius = 150;
        var delayAmount = 0;
        var delayNode;
        var present = true, past = false;
        var showText = true, showSprite = true;
        var location = 0;
        var undulate = 3, playSpeed = 1.0;
        var invert = false, sepia = false, emboss = false;
        var waveForm = false;
        var trackName = SOUND_1;
        
        // Sprite
        var aeroshipSprite;
        var shift = 0;
        var frameWidth = 66.5;
        var frameHeight = 150;
        var totalFrames = 5;
        var currentFrame = 0;
        var counter = 0;
        var spritePos = {};
		
        // Initialize
		function init(){
			// set up canvas stuff
			canvas = document.querySelector('canvas');
			ctx = canvas.getContext("2d");
            
			// get reference to <audio> element on page
			audioElement = document.querySelector('audio');
			
			// call our helper function and get an analyser node
			analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
			
            // Set up sprite
            aeroshipSprite = new Image();
            aeroshipSprite.src = "image/aeroship-sprite.png";
            aeroshipSprite.addEventListener("load", loadImage, false);
            
			// get sound track <select> and Full Screen button working
			setupUI();
			
			// load and play default sound into audio element
			playStream(audioElement,SOUND_1);
			
			// start animation loop
			update();
		}
		
        // Set up the audio stuff
		function createWebAudioContextWithAnalyserNode(audioElement) {
			var audioCtx, analyserNode, sourceNode;
			// create new AudioContext
			// The || is because WebAudio has not been standardized across browsers yet
			// http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
			audioCtx = new (window.AudioContext || window.webkitAudioContext);
			
			// create an analyser node
			analyserNode = audioCtx.createAnalyser();
            
            // create DelayNode instance
            delayNode = audioCtx.createDelay();
            delayNode.delayTime.value = delayAmount;

			/*
			We will request NUM_SAMPLES number of samples or "bins" spaced equally 
			across the sound spectrum.
			
			If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
			the third is 344Hz. Each bin contains a number between 0-255 representing 
			the amplitude of that frequency.
			*/ 
			
			// fft stands for Fast Fourier Transform
			analyserNode.fftSize = NUM_SAMPLES;
            
			// this is where we hook up the <audio> element to the analyserNode
			sourceNode = audioCtx.createMediaElementSource(audioElement); 
            //sourceNode.connect(analyserNode);
            
            // connect source node directly to speakers so we can hear the
            // unaltered source in this channel
            sourceNode.connect(audioCtx.destination);
             
            // this channel will play and visualize the delay
            sourceNode.connect(delayNode);
            delayNode.connect(analyserNode);
            analyserNode.connect(audioCtx.destination);
            
			
			//
			//// here we connect to the destination i.e. speakers
			//analyserNode.connect(audioCtx.destination);
			return analyserNode;
		}
		
        // Set up UI
		function setupUI()
        {
            // Tracks
			document.querySelector("#trackSelect").onchange = function(e){
				playStream(audioElement,e.target.value);
                trackName = e.target.value;
			};
			
            // Fullscreen
			document.querySelector("#fsButton").onclick = function(){
				requestFullscreen(canvas);
			};
            
            // Reset
            document.querySelector("#resetButton").onclick = function(){
                reset();
            };
            
            // Adjust visual audio
            document.querySelector("#waveCheck").onchange = function(e){
                if (waveForm) waveForm = false;
                else waveForm = true;
            };
            
            // Radius change
            document.querySelector("#radiusRange").onchange = function(e){
                changeRadius(e.target.value);
            };
            
            // Undulate change
            document.querySelector("#undulateRange").onchange = function(e){
                undulate = e.target.value;
            };
            
            // Playback speed
            document.querySelector("#playSpeed").onchange = function(e){
                playSpeed = e.target.value;
                audioElement.playbackRate = e.target.value;
            };
            
            // Reverb/delay
            document.querySelector("#reverbRange").onchange = function(e){
                delayAmount = e.target.value;
            };
            
            // Invert
            document.querySelector("#invertCheck").onchange = function(e){
                if (invert) invert = false;
                else invert = true;
            };
            
            // Sepia
            document.querySelector("#sepiaCheck").onchange = function(e){
                if (sepia) sepia = false;
                else sepia = true;
            };
            
            // Emboss
            document.querySelector("#embossCheck").onchange = function(e){
                if (emboss) emboss = false;
                else emboss = true;
            };
            
            // What time is it?
            document.querySelector("#timeSelect").onchange = function(e){
                if (e.target.value == "present")
                {
                    present = true;
                    past = false;
                }
                else if (e.target.value == "past")
                {
                    present = false;
                    past = true;
                }
            };
            
            // Where are we?
            document.querySelector("#locateSelect").onchange = function(e){
                location = parseInt(e.target.value);
            };
            
            // Turn on/off the text
            document.querySelector("#textShow").onchange = function(e){
                if (showText) showText = false;
                else showText = true;
            };
            
            // Show/hide the aeroship
            document.querySelector("#spriteShow").onchange = function(e){
                if (showSprite) showSprite = false;
                else
                {
                    // Restart the sprite animation!
                    showSprite = true;
                    animate();
                }
            };
		}
		
        // Play!
		function playStream(audioElement,path){
			audioElement.src = "media/" + path + ".mp3";
            audioElement.playbackRate = playSpeed;
			audioElement.play();
			audioElement.volume = 1;
		}
        
        // Change sun radius
        function changeRadius(newRadius)
        {
            maxRadius = newRadius;
        }
		
        // Switch between frequency and waveform
        function setAudioData(data)
        {
            if (waveForm) analyserNode.getByteTimeDomainData(data); // waveform data
            else analyserNode.getByteFrequencyData(data);  // frequency data
        }
        
        // Load image
        function loadImage(e)
        {
            spritePos.x = canvas.width-100;  // set the position
            spritePos.y = 25;
            animate();                       // animate
        }
        
        // Animate!
        function animate()
        {
            if (!showSprite) return;
            
            ctx.drawImage(aeroshipSprite, shift, 0, 
                          frameWidth, frameHeight, 
                          spritePos.x, spritePos.y, 
                          frameWidth, frameHeight);
            
            // Restart back to start of sprite
            // while ignoring the last sprite because it'll keep on blinking
            if (currentFrame == totalFrames-1)
            {
                shift = 0;
                currentFrame = 0;
            }
            
            // Slow down!
            if (counter == 15)
            {
                currentFrame++;
                counter = 0;
                shift += frameWidth;

            }
            else counter++;
            
            requestAnimationFrame(animate);
        }
        
        // Reset filter settings (but not music)!
        function reset()
        {
            // Reset variables...
            maxRadius = 150;
            delayAmount = 0;
            present = true;
            past = false;
            location = 0;
            undulate = 3;
            playSpeed = 1.0;
            audioElement.playbackRate = 1.0;
            invert = false;
            sepia = false;
            emboss = false;
            waveForm = false;
           
            
            // ...and reflect it on UI!
            document.querySelector("#waveCheck").checked = false;
            document.querySelector("#radiusRange").value = "150";
            document.querySelector("#undulateRange").value = "3";
            document.querySelector("#playSpeed").value = "1.0";
            document.querySelector("#reverbRange").value = "0";
            document.querySelector("#invertCheck").checked = false;
            document.querySelector("#sepiaCheck").checked = false;
            document.querySelector("#embossCheck").checked = false;
            document.querySelector("#timeSelect").value = "present";
            document.querySelector("#locateSelect").value = "0";
            
            // Special cases
            if (!showText)
            {
                showText = true;
                document.querySelector("#textShow").checked = true;
            }
            if (!showSprite)
            {
                showSprite = true;
                document.querySelector("#spriteShow").checked = true;
                animate();
            }
        }
        
		function update() { 
			// this schedules a call to the update() method in 1/60 seconds
			requestAnimationFrame(update);
			
			/*
				Nyquist Theorem
				http://whatis.techtarget.com/definition/Nyquist-Theorem
				The array of data we get back is 1/2 the size of the sample rate 
			*/
			
			// create a new array of 8-bit integers (0-255)
			var data = new Uint8Array(NUM_SAMPLES/2); 
			
			// populate the array with the frequency data
			// notice these arrays can be passed "by reference" 
			setAudioData(data);
            
            // update reverb
            delayNode.delayTime.value = delayAmount;
		
			// DRAW!
			ctx.clearRect(0,0,canvas.width,canvas.height);
            
            // Background & visual effects
            drawBackground(data);

            // Manipulate the colorz!
            manipulatePixels();
            
            // Update the in-game text
            if (showText) drawText(10, canvas.height-20, trackName);
		} 
		
		// HELPER
        // Draw text
        function drawText(x, y, path)
        {
            ctx.font = 'normal 15pt Coda';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = "rgb(0,0,0)";
            ctx.textAlign = "left";  // horizontal
            ctx.textBaseline = "middle";  // vertical
            ctx.strokeText('Now playing: ' + path, x, y);
            ctx.fillText('Now playing: ' + path, x, y);
        }
        
        // Make a gradient
        function makeGrad(x,y,w,h,sea)
        {
            var grad = ctx.createLinearGradient(0, canvas.height/2, 0, canvas.height-20);
            switch(sea)
            {
                case 0:  
                    // Atlantic
                    grad.addColorStop(0, "rgb(70, 132, 220");
                    grad.addColorStop(7/8, "rgb(39, 71, 156)");
                    break;
                case 1:  
                    // Pacific
                    grad.addColorStop(0, "rgb(61, 113, 187");
                    grad.addColorStop(1, "rgb(29, 55, 101)");
                    break;
                case 2:  
                    // Red Sea
                    grad.addColorStop(0, "rgb(211, 45, 45");
                    grad.addColorStop(7/8, "rgb(86, 17, 17)");
                    break;
                case 3:  
                    // Yellow Sea
                    grad.addColorStop(0, "rgb(229, 219, 52");
                    grad.addColorStop(7/8, "rgb(119, 114, 30)");
                    break;
                case 4:
                    // Black Sea
                    grad.addColorStop(0, "rgb(141, 141, 141");
                    grad.addColorStop(7/8, "rgb(0, 0, 0)");
                    break;
                case 5:
                    // White Sea
                    grad.addColorStop(0, "rgb(229, 246, 253)");
                    grad.addColorStop(7/8, "rgb(255, 255, 255)");
                    break;
                case 6:
                    // Coral Sea
                    grad.addColorStop(0, "rgb(255, 137, 103)");
                    grad.addColorStop(7/8, "rgb(199, 109, 86)");
                    break;
            }
            
            return grad;
        }
        
        // Draw the setting and sound effects
        function drawBackground(data)
        {
            // Backgrounds - they're worth a Google
            // Sky
            var skyColor;
            switch(location)
            {
                case 0:
                    // Atlantic
                    skyColor = "rgb(90, 170, 201)";
                    break;
                case 1:
                    // Pacific
                    skyColor = "rgb(90, 170, 201)";
                    break;
                case 2:
                    // Red Sea
                    skyColor = "rgb(233, 101, 101)";
                    break;
                case 3:
                    // Yellow Sea
                    skyColor = "rgb(233, 197, 134)";
                    break;
                case 4:
                    // Black Sea
                    skyColor = "rgb(172, 172, 172)";
                    break;
                case 5:
                    // White Sea
                    skyColor = "rgb(201, 235, 248)";
                    break;
                case 6:
                    // Coral Sea
                    skyColor = "rgb(255, 172, 153)";
                    break;
            }
            ctx.fillStyle = skyColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Sun
            for (var i=0; i<data.length; i++)
            {
                drawCircle(data, i);
            }
            
            // Sea
            var grad = makeGrad(0, canvas.height/2, 0, canvas.height-20, location);
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height/2+60, canvas.width, canvas.height/2);
            
            // Lights out at sea
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
            ctx.setLineDash([1.4, 3.2]);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height/2+70);
            ctx.lineTo(canvas.width, canvas.height/2+70);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
            
            // We're gonna go frequency or wavy?
            if (waveForm)
            {
                // Waveform/dancing seaweed!
                var prevX = 0, baseY, cpX, cpY, newX, newY;
                for (var i=0; i<data.length; i++)
                {
                    ctx.save();
                    baseY = (canvas.height/2+150);
                    cpX = prevX+5;
                    cpY = (canvas.height/2+150)-data[i]/undulate*3;
                    newX = prevX+10;
                
                    drawCurves(prevX, baseY, cpX, cpY, newX, baseY, false, "rgb(66, 120, 6)", false);
                    drawCurves(prevX, baseY, cpX, cpY, newX, baseY, false, "rgba(0,0,0,0.35)", true);
                    
                    prevX = newX;
                    ctx.restore();
                }
            }
            else
            {
                // Frequency/dancing ice waves
                drawWaves(data, false);
                drawWaves(data, true);
                drawUnderwaterWaves(data, false);
                drawUnderwaterWaves(data, true);
            
            }
        }
        
        // Draw the frequency waves above water
        function drawWaves(data, reverse)
        {
            ctx.fillStyle = "rgba(255,255,255, 0.5)";
            
            // Which side?
            if (reverse)
            {
                // Right side
                ctx.beginPath();
                ctx.moveTo(canvas.width, canvas.height/2+60);
                
                for (var i=0; i<data.length; i++)
                {
                    ctx.lineTo(canvas.width-i*4.3, (canvas.height/2+60)-data[i]/undulate);
                }
                
                ctx.lineTo(0, canvas.height/2+60);
                ctx.fill();
                ctx.closePath();
            }
            else
            {
                // Left side
                ctx.beginPath();
                ctx.moveTo(0, canvas.height/2+60);
                
                for (var i=0; i<data.length; i++)
                {
                    ctx.lineTo(i*4.3, (canvas.height/2+60)-data[i]/undulate);
                }
                
                ctx.lineTo(canvas.width, canvas.height/2+60);
                ctx.fill();
                ctx.closePath();
            }  
        }
        
        // Draw the frequency waves underwater
        function drawUnderwaterWaves(data, reverse)
        {
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            var prevX;
            if (reverse)
            {
                prevX = canvas.width;  // right side
            }
            else
            {
                prevX = 0;  // left side
            }
            var baseY = 256;
            var newX;
            var newY;
            
            for (var i=0; i<data.length; i++)
            {
                ctx.save();
                ctx.translate(canvas.width,canvas.height+75);
                ctx.rotate(3.14);
                
                // Which side?
                if (reverse)
                {
                    // Right side
                    newX = i * 4.32;
                    newY = 256 - data[i]/undulate;
                    ctx.beginPath();
                    ctx.moveTo(prevX, baseY);
                    ctx.lineTo(prevX, newY);
                    ctx.stroke();
                    ctx.closePath();
                }
                else
                {
                    // Left side
                    newX = canvas.width - (i * 4.32);
                    newY = 256 - data[i]/undulate;
                    ctx.beginPath();
                    ctx.moveTo(prevX, baseY);
                    ctx.lineTo(prevX, newY);
                    ctx.stroke();
                    ctx.closePath();
                }
                
                // Update
                prevX = newX;
                ctx.restore();
            }
        }
        
        // Draw the sun
        function drawCircle(data, i)
        {
            var percent = data[i]/255;
            var circleRadius = percent * maxRadius;
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.arc(canvas.width/2, canvas.height/2, maxRadius/4, 0, 2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.beginPath();
            
            if (waveForm)
            {
                ctx.arc(canvas.width/2, canvas.height/2, circleRadius, 0, 2*Math.PI, false);
                ctx.stroke();
            }
            else
            {
                ctx.arc(canvas.width/2, canvas.height/2, circleRadius, 0, 2*Math.PI, false);
                ctx.fill();
            }
            
            ctx.closePath();
        }
        
        // Draw the waveform curves
        // Using both Bezier and Quadratic curves
        function drawCurves(x1, y1, cpX, cpY, x2, y2, closePath, color, upsideDown)
        {
            if (!waveForm) return;
            if (upsideDown)
            {
                ctx.translate(canvas.width,canvas.height+299);
                ctx.rotate(3.14);
                ctx.fillStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.bezierCurveTo(cpX-2.5, cpY+30, cpX+2.5, cpY+30, x2, y2);
                ctx.fill();
            }
            else
            {
                ctx.fillStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.quadraticCurveTo(cpX, cpY, x2, y2);
                ctx.fill();
            }
            
            if (closePath) ctx.closePath();
        }
        
        // Manipulate the colors
        function manipulatePixels()
        {
            // Get all of rgba pixels of canvas by grabbing the
            // ImageData Object
            // https://developer.mozilla.org/en-US/docs/Web/API/ImageData
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // imageData is 8-bit typed array - values range from 0-255
            var data = imageData.data;
            var length = data.length;
            var width = imageData.width;
            
            // Iterate through each pixel
            // data[i] = red
            // data[i+1] = green
            // data[i+2] = blue
            // data[i+3] = alpha
            for (var i = 0; i < length; i+=4)
            {
                // Invert color
                if (invert)
                {
                    var red = data[i],
                        green = data[i+1],
                        blue = data[i+2];
                    
                    data[i] = 255-red;
                    data[i+1] = 255-green;
                    data[i+2] = 255-blue;
                }
                
                // Sepia
                if (sepia)
                {
                    var red = data[i],
                        green = data[i+1],
                        blue = data[i+2];
                    
                    data[i] = (red * .393) + (green * .769) + (blue * .189);
                    data[i+1] = (red * .349) + (green * .686) + (blue * .168);
                    data[i+2] = (red * .272) + (green * .534) + (blue * .131);
                }
                
                // Emboss (ugh!)
                if (emboss)
                {
                    for (var i=0; i<length; i++)
                    {
                        if (i%4 == 3) continue;
                        data[i] = 127 + 2*data[i] - data[i+4] - data[i+width*4];
                    }
                }
                
                // Today!
                if (present)
                {
                    // Back to normal
                    continue;
                }
                
                // Yesterday!
                if (past)
                {
                    var bright = 0.34 * data[i] + 0.5 * data[i+1] + 0.16 * data[i+2];
                    data[i] = bright;
                    data[i+1] = bright;
                    data[i+2] = bright;
                    
                    // Noise
                    if (Math.random() < .10)
                    {
                        if (location == 5)
                        {
                            if (invert)
                            {
                                data[i] = data[i+1] = data[i+2] = 255;
                            }
                            else
                            {
                                 data[i] = data[i+1] = data[i+2] = 0;
                            }
                        }
                        else
                        {
                            data[i] = data[i+1] = data[i+2] = 0;
                        }
                    }
                }
                 
                
            }
            
            // Put the modified data back on canvas
            ctx.putImageData(imageData, 0, 0);
        }
        
        // FULL SCREEN MODE
		function requestFullscreen(element) {
			if (element.requestFullscreen) {
			  element.requestFullscreen();
			} else if (element.mozRequestFullscreen) {
			  element.mozRequestFullscreen();
			} else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
			  element.mozRequestFullScreen();
			} else if (element.webkitRequestFullscreen) {
			  element.webkitRequestFullscreen();
			}
			// .. and do nothing if the method is not supported
		};
		
		window.addEventListener("load",init);
	}());