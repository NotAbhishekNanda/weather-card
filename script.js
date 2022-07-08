let container = $('.container');
let card = $('#card');
let innerSVG = Snap('#inner');
let outerSVG = Snap('#outer');
let backSVG = Snap('#back');
let summary = $('#summary');
let date = $('#date');
let weatherContainer1 = Snap.select('#layer1');
let weatherContainer2 = Snap.select('#layer2');
let weatherContainer3 = Snap.select('#layer3');
let innerRainHolder1 = weatherContainer1.group();
let innerRainHolder2 = weatherContainer2.group();
let innerRainHolder3 = weatherContainer3.group();
let innerLeafHolder = weatherContainer1.group();
let innerSnowHolder = weatherContainer1.group();
let innerLightningHolder = weatherContainer1.group();
let leafMask = outerSVG.rect();
let leaf = Snap.select('#leaf');
let sun = Snap.select('#sun');
let sunburst = Snap.select('#sunburst');
let outerSplashHolder = outerSVG.group();
let outerLeafHolder = outerSVG.group();
let outerSnowHolder = outerSVG.group();

let lightningTimeout;

// Set mask for leaf holder 

outerLeafHolder.attr({
	'clip-path': leafMask
});

// create sizes object, we update this later

let sizes = {
	container: {width: 0, height: 0},
	card: {width: 0, height: 0}
}

// grab cloud groups

let clouds = [
	{group: Snap.select('#cloud1')},
	{group: Snap.select('#cloud2')},
	{group: Snap.select('#cloud3')}
]

// set weather types ☁️ 🌬 🌧 ⛈ ☀️

let weather = [
	{ type: 'snow', name: 'Snow'}, 
	{ type: 'wind', name: 'Windy'}, 
	{ type: 'rain', name: 'Rain'}, 
	{ type: 'thunder', name: 'Storms'},
	{ type: 'sun', name: 'Sunny'}
];

// 🛠 app settings
// in an object so the values can be animated in tweenmax

let settings = {
	windSpeed: 2,
	rainCount: 0,
	leafCount: 0,
	snowCount: 0,
	cloudHeight: 100,
	cloudSpace: 30,
	cloudArch: 50,
	renewCheck: 10,
	splashBounce: 80
};

let tickCount = 0;
let rain = [];
let leafs = [];
let snow = [];

// ⚙ initialize app

init();

// 👁 watch for window resize

$(window).resize(onResize);

// 🏃 start animations

requestAnimationFrame(tick);

function init()
{
	onResize();
	
	// 🖱 bind weather menu buttons
	
	for(let i = 0; i < weather.length; i++)
	{
		let w = weather[i];
		let b = $('#button-' + w.type);
		w.button = b;
		b.bind('click', w, changeWeather);
	}
	
	// ☁️ draw clouds
	
	for(let i = 0; i < clouds.length; i++)
	{
		clouds[i].offset = Math.random() * sizes.card.width;
		drawCloud(clouds[i], i);
	}
	
	// ☀️ set initial weather
	
	TweenMax.set(sunburst.node, {opacity: 0})
	changeWeather(weather[0]);
}

function onResize()
{
	// 📏 grab window and card sizes 
	
	sizes.container.width = container.width();
	sizes.container.height = container.height();
	sizes.card.width = card.width();
	sizes.card.height = card.height();
	sizes.card.offset = card.offset();
	
	// 📐 update svg sizes
	
	innerSVG.attr({
		width: sizes.card.width,
		height: sizes.card.height
	})
	
	outerSVG.attr({
		width: sizes.container.width,
		height: sizes.container.height
	})	
	
	backSVG.attr({
		width: sizes.container.width,
		height: sizes.container.height
	})
	
	TweenMax.set(sunburst.node, {transformOrigin:"50% 50%", x: sizes.container.width / 2, y: (sizes.card.height/2) + sizes.card.offset.top});
	TweenMax.fromTo(sunburst.node, 20, {rotation: 0}, {rotation: 360, repeat: -1, ease: Power0.easeInOut})
	// 🍃 The leaf mask is for the leafs that float out of the
	// container, it is full window height and starts on the left
	// inline with the card
	
	leafMask.attr({x: sizes.card.offset.left, y: 0, width: sizes.container.width - sizes.card.offset.left,  height: sizes.container.height});
}

function drawCloud(cloud, i)
{
	/* 
	
	☁️ We want to create a shape thats loopable but that can also
	be animated in and out. So we use Snap SVG to draw a shape
	with 4 sections. The 2 ends and 2 arches the same width as
	the card. So the final shape is about 4 x the width of the
	card.
	
	*/
	
	let space  = settings.cloudSpace * i;
	let height = space + settings.cloudHeight;
	let arch = height + settings.cloudArch + (Math.random() * settings.cloudArch);
	let width = sizes.card.width;
	
	let points = [];
	points.push('M' + [-(width), 0].join(','));
	points.push([width, 0].join(','));
	points.push('Q' + [width * 2, height / 2].join(','));
	points.push([width, height].join(','));
	points.push('Q' + [width * 0.5, arch].join(','));
	points.push([0, height].join(','));
	points.push('Q' + [width * -0.5, arch].join(','));
	points.push([-width, height].join(','));
	points.push('Q' + [- (width * 2), height/2].join(','));
	points.push([-(width), 0].join(','));
	
	let path = points.join(' ');
	if(!cloud.path) cloud.path = cloud.group.path();
	cloud.path.animate({
  		d: path
	}, 0)
}

function makeRain()
{
	// 💧 This is where we draw one drop of rain
	
	// first we set the line width of the line, we use this
	// to dictate which svg group it'll be added to and 
	// whether it'll generate a splash
	
	let lineWidth = Math.random() * 3;
	
	// ⛈ line length is made longer for stormy weather
	
	let lineLength = currentWeather.type == 'thunder' ? 35 : 14;
	
	// Start the drop at a random point at the top but leaving 
	// a 20px margin 
	
	let x = Math.random() * (sizes.card.width - 40) + 20;
	
	// Draw the line
	
	let line = this['innerRainHolder' + (3 - Math.floor(lineWidth))].path('M0,0 0,' + lineLength).attr({
		fill: 'none',
		stroke: currentWeather.type == 'thunder' ? '#777' : '#0000ff',
		strokeWidth: lineWidth
	});
	
	// add the line to an array to we can keep track of how
	// many there are.
	
	rain.push(line);
	
	// Start the falling animation, calls onRainEnd when the 
	// animation finishes.
	
	TweenMax.fromTo(line.node, 1, {x: x, y: 0- lineLength}, {delay: Math.random(), y: sizes.card.height, ease: Power2.easeIn, onComplete: onRainEnd, onCompleteParams: [line, lineWidth, x, currentWeather.type]});
}

function onRainEnd(line, width, x, type)
{
	// first lets get rid of the drop of rain 💧
	
	line.remove();
	line = null;
	
	// We also remove it from the array
	
	for(let i in rain)
	{
		if(!rain[i].paper) rain.splice(i, 1);
	}
	
	// If there is less rain than the rainCount we should
	// make more.
	
	if(rain.length < settings.rainCount)
	{
		makeRain();
		
		// 💦 If the line width was more than 2 we also create a 
		// splash. This way it looks like the closer (bigger) 
		// drops hit the the edge of the card
		
		if(width > 2) makeSplash(x, type);
	}
}

function makeSplash(x, type)
{
	// 💦 The splash is a single line added to the outer svg.

	// The splashLength is how long the animated line will be
	let splashLength = type == 'thunder' ? 30 : 20;
	
	// splashBounce is the max height the line will curve up
	// before falling
	let splashBounce = type == 'thunder' ? 120 : 100;
	
	// this sets how far down the line can fall
	let splashDistance = 80;
	
	// because the storm rain is longer we want the animation
	// to last slighly longer so the overall speed is roughly
	// the same for both
	let speed = type == 'thunder' ? 0.7 : 0.5;
	
	// Set a random splash up amount based on the max splash bounce
	let splashUp = 0 - (Math.random() * splashBounce);
	
	// Sets the end x position, and in turn defines the splash direction
	let randomX = ((Math.random() * splashDistance) - (splashDistance / 2));
	
	// Now we put the 3 line coordinates into an array. 
	
	let points = [];
	points.push('M' + 0 + ',' + 0);
    points.push('Q' + randomX + ',' + splashUp);
    points.push((randomX * 2) + ',' + splashDistance);
	
	// Draw the line with Snap SVG
	
	let splash = outerSplashHolder.path(points.join(' ')).attr({
      	fill: "none",
      	stroke: type == 'thunder' ? '#777' : '#0000ff',
      	strokeWidth: 1
    });
	
	// We animate the dasharray to have the line travel along the path 
	
	let pathLength = Snap.path.getTotalLength(splash);
	let xOffset = sizes.card.offset.left;//(sizes.container.width - sizes.card.width) / 2
	let yOffset = sizes.card.offset.top + sizes.card.height; 
    splash.node.style.strokeDasharray = splashLength + ' ' + pathLength;
	
	// Start the splash animation, calling onSplashComplete when finished
	TweenMax.fromTo(splash.node, speed, {strokeWidth: 2, y: yOffset, x: xOffset + 20 + x, opacity: 1, strokeDashoffset: splashLength}, {strokeWidth: 0, strokeDashoffset: - pathLength, opacity: 1, onComplete: onSplashComplete, onCompleteParams: [splash], ease:  SlowMo.ease.config(0.4, 0.1, false)})
}

function onSplashComplete(splash)
{
	// 💦 The splash has finished animating, we need to get rid of it
	
	splash.remove();
	splash = null;
}

function makeLeaf()
{
	let scale = 0.5 + (Math.random() * 0.5);
	let newLeaf;
	
	let areaY = sizes.card.height/2;
	let y = areaY + (Math.random() * areaY);
	let endY = y - ((Math.random() * (areaY * 2)) - areaY)
	let x;
	let endX;
	let colors = ['#76993E', '#4A5E23', '#6D632F'];
	let color = colors[Math.floor(Math.random() * colors.length)];
	let xBezier;
	
	if(scale > 0.8)
	{
		newLeaf = leaf.clone().appendTo(outerLeafHolder)
		.attr({
			fill: color
		})
		y = y + sizes.card.offset.top / 2;
		endY = endY + sizes.card.offset.top / 2;
		
		x = sizes.card.offset.left - 100;
		xBezier = x + (sizes.container.width - sizes.card.offset.left) / 2;
		endX = sizes.container.width + 50;
	}
	else 
	{
		newLeaf = leaf.clone().appendTo(innerLeafHolder)
		.attr({
			fill: color
		})
		x = -100;
		xBezier = sizes.card.width / 2;
		endX = sizes.card.width + 50;
		
	}
	
	leafs.push(newLeaf);
	 
	
	let bezier = [{x:x, y:y}, {x: xBezier, y:(Math.random() * endY) + (endY / 3)}, {x: endX, y:endY}]
	TweenMax.fromTo(newLeaf.node, 2, {rotation: Math.random()* 180, x: x, y: y, scale:scale}, {rotation: Math.random()* 360, bezier: bezier, onComplete: onLeafEnd, onCompleteParams: [newLeaf], ease: Power0.easeIn})
}

function onLeafEnd(leaf)
{
	leaf.remove();
	leaf = null;
	
	for(let i in leafs)
	{
		if(!leafs[i].paper) leafs.splice(i, 1);
	}
	
	if(leafs.length < settings.leafCount)
	{
		makeLeaf();
	}
}

function makeSnow()
{
	let scale = 0.5 + (Math.random() * 0.5);
	let newSnow;
	
	let x = 20 + (Math.random() * (sizes.card.width - 40));
	let endX; // = x - ((Math.random() * (areaX * 2)) - areaX)
	let y = -10;
	let endY;
	
	if(scale > 0.8)
	{
		newSnow = outerSnowHolder.circle(0, 0, 5)
			.attr({
				fill: 'white'
			})
		endY = sizes.container.height + 10;
		y = sizes.card.offset.top + settings.cloudHeight;
		x =  x + sizes.card.offset.left;
		//xBezier = x + (sizes.container.width - sizes.card.offset.left) / 2;
		//endX = sizes.container.width + 50;
	}
	else 
	{
		newSnow = innerSnowHolder.circle(0, 0 ,5)
		.attr({
			fill: 'white'
		})
		endY = sizes.card.height + 10;
		//x = -100;
		//xBezier = sizes.card.width / 2;
		//endX = sizes.card.width + 50;
		
	}
	
	snow.push(newSnow);
	 
	
	TweenMax.fromTo(newSnow.node, 3 + (Math.random() * 5), {x: x, y: y}, {y: endY, onComplete: onSnowEnd, onCompleteParams: [newSnow], ease: Power0.easeIn})
	TweenMax.fromTo(newSnow.node, 1,{scale: 0}, {scale: scale, ease: Power1.easeInOut})
	TweenMax.to(newSnow.node, 3, {x: x+((Math.random() * 150)-75), repeat: -1, yoyo: true, ease: Power1.easeInOut})
}

function onSnowEnd(flake)
{
	flake.remove();
	flake = null;
	
	for(let i in snow)
	{
		if(!snow[i].paper) snow.splice(i, 1);
	}
	
	if(snow.length < settings.snowCount)
	{
		makeSnow();
	}
}

function tick()
{
	tickCount++;
	let check = tickCount % settings.renewCheck;
	
	if(check)
	{
		if(rain.length < settings.rainCount) makeRain();
		if(leafs.length < settings.leafCount) makeLeaf();
		if(snow.length < settings.snowCount) makeSnow();
	}
	
	for(let i = 0; i < clouds.length; i++)
	{		
		if(currentWeather.type == 'sun')
		{
			if(clouds[i].offset > -(sizes.card.width * 1.5)) clouds[i].offset += settings.windSpeed / (i + 1);
			if(clouds[i].offset > sizes.card.width * 2.5) clouds[i].offset = -(sizes.card.width * 1.5);
			clouds[i].group.transform('t' + clouds[i].offset + ',' + 0);
		}
		else
		{	
			clouds[i].offset += settings.windSpeed / (i + 1);
			if(clouds[i].offset > sizes.card.width) clouds[i].offset = 0 + (clouds[i].offset - sizes.card.width);
			clouds[i].group.transform('t' + clouds[i].offset + ',' + 0);
		}
	}
	
	requestAnimationFrame(tick);
}

function reset()
{
	for(let i = 0; i < weather.length; i++)
	{
		container.removeClass(weather[i].type);
		weather[i].button.removeClass('active');
	}
}

function updateSummaryText()
{
	summary.html(currentWeather.name);
	TweenMax.fromTo(summary, 1.5, {x: 30}, {opacity: 1, x: 0, ease: Power4.easeOut});
}

function startLightningTimer()
{
	if(lightningTimeout) clearTimeout(lightningTimeout);
	if(currentWeather.type == 'thunder')
	{
		lightningTimeout = setTimeout(lightning, Math.random()*6000);
	}	
}

function lightning()
{
	startLightningTimer();
	TweenMax.fromTo(card, 0.75, {y: -30}, {y:0, ease:Elastic.easeOut});
	
	let pathX = 30 + Math.random() * (sizes.card.width - 60);
	let yOffset = 20;
	let steps = 20;
	let points = [pathX + ',0'];
	for(let i = 0; i < steps; i++)
	{
		let x = pathX + (Math.random() * yOffset - (yOffset / 2));
		let y = (sizes.card.height / steps) * (i + 1)
		points.push(x + ',' + y);
	}
	
	let strike = weatherContainer1.path('M' + points.join(' '))
	.attr({
		fill: 'none',
		stroke: 'white',
		strokeWidth: 2 + Math.random()
	})
	
	TweenMax.to(strike.node, 1, {opacity: 0, ease:Power4.easeOut, onComplete: function(){ strike.remove(); strike = null}})
}

function changeWeather(weather)
{
	if(weather.data) weather = weather.data;
	reset();
	
	currentWeather = weather;
	
	TweenMax.killTweensOf(summary);
	TweenMax.to(summary, 1, {opacity: 0, x: -30, onComplete: updateSummaryText, ease: Power4.easeIn})
	
	container.addClass(weather.type);
	weather.button.addClass('active');
	
	// windSpeed
	
	switch(weather.type)
	{
		case 'wind':
			TweenMax.to(settings, 3, {windSpeed: 3, ease: Power2.easeInOut});
			break;
		case 'sun':
			TweenMax.to(settings, 3, {windSpeed: 20, ease: Power2.easeInOut});
			break;
		default:
			TweenMax.to(settings, 3, {windSpeed: 0.5, ease: Power2.easeOut});
			break;
	}	
	
	// rainCount
	
	switch(weather.type)
	{
		case 'rain':
			TweenMax.to(settings, 3, {rainCount: 10, ease: Power2.easeInOut});
			break;
		case 'thunder':
			TweenMax.to(settings, 3, {rainCount: 60, ease: Power2.easeInOut});
			break;
		default:
			TweenMax.to(settings, 1, {rainCount: 0, ease: Power2.easeOut});
			break;
	}	
	
	// leafCount
	
	switch(weather.type)
	{
		case 'wind':
			TweenMax.to(settings, 3, {leafCount: 5, ease: Power2.easeInOut});
			break;
		default:
			TweenMax.to(settings, 1, {leafCount: 0, ease: Power2.easeOut});
			break;
	}	
	
	// snowCount
	
	switch(weather.type)
	{
		case 'snow':
			TweenMax.to(settings, 3, {snowCount: 40, ease: Power2.easeInOut});
			break;
		default:
			TweenMax.to(settings, 1, {snowCount: 0, ease: Power2.easeOut});
			break;
	}
	
	// sun position
	
	switch(weather.type)
	{
		case 'sun':
			TweenMax.to(sun.node, 4, {x: sizes.card.width / 2, y: sizes.card.height / 2, ease: Power2.easeInOut});
			TweenMax.to(sunburst.node, 4, {scale: 1, opacity: 0.8, y: (sizes.card.height/2) + (sizes.card.offset.top), ease: Power2.easeInOut});
			break;
		default:
			TweenMax.to(sun.node, 2, {x: sizes.card.width / 2, y: -100, leafCount: 0, ease: Power2.easeInOut});
			TweenMax.to(sunburst.node, 2, {scale: 0.4, opacity: 0, y: (sizes.container.height/2)-50, ease: Power2.easeInOut});
			break;
	}	
	
	// lightning
	
	startLightningTimer();
}