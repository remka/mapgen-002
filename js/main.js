/* main.js */

// Constants
var tileW = 10;
var tileH = 10;
var mapWidth = 120;
var mapHeight = 120;

var tick = 0;
var cycle = 0;
var cycleLength = 100;

var drawMode = 'canvas'; // 'dom' or 'canvas'
var viewMode = 'biomes'; // 'biomes' or 'height'

// Variables
var gen;

// Arrays to store elevations and moisture
var mapElevations = [];
var mapMoisture = [];
var mapElFlat = [];

// jquery shortcuts
var $mapContainer = $('#mapContainer');
var $tiles = $('.tile');

// Make biomes
// TODO: Make that cleaner, maybe store as json somewhere
var makeBiome = function(e) {
  if (e < 0.3) {
    return ['WATER', '#43437a'];
  } else if (e < 0.4) {
    return ['BEACH', '#d2b98b'];
  } else if (e < 0.5) {
    return ['FOREST', '#c9d29b'];
  } else if (e < 0.6) {
    return ['SAVANNAH', '#88ab55'];
  } else if (e < 0.7) {
    return ['DESERT', '#327755'];
  } else if (e < 0.8) {
    return ['TOUNDRA', '#86a18a'];
  } else if (e < 0.9) {
    return ['COLDISH', '#bbbbaa'];
  } else {
    return ['SNOW', '#ffffff'];
  }
};

// hex to rgb
var hexToRgb = function(hex) {
  var hex, r, g, b, result;
  hex = hex.replace('#', '');
  r = parseInt(hex.substring(0, 2), 16);
  g = parseInt(hex.substring(2, 4), 16);
  b = parseInt(hex.substring(4, 6), 16);
  result = {r: r, g: g, b: b};
  return result;
};

// create empty map array
var createArrays = function() {
  for (var i = 0; i < mapHeight; i++) {
    mapElevations[i] = [];
    for (var j = 0; j < mapWidth; j++) {
      mapElevations[i][j] = 0;
    }
  }
};

// Resize canvas
var resizeCanvas = function() {
  var canvasW = mapWidth * tileW;
  var canvasH = mapHeight * tileH;
  ctx.canvas.width = canvasW;
  ctx.canvas.height = canvasH;
};

// Rescale noise
var noise = function(nx, ny) {
  // Rescale from -1.0:+1.0 to 0.0:1.0
  return gen.noise2D(nx, ny) / 2 + 0.5;
};

// Create individual tiles
// in DOM
var addTile = function(x, y, e) {
  // var elv = Math.floor(e * 255);
  // var color = 'rgb(' + elv + ',' + elv + ',' + elv + ')';
  var biome = makeBiome(e);
  var tileName = 'tile_' + x + '_' + y;
  var leftPos = x * tileW;
  var topPos = y * tileH;
  var color = biome[1];
  var tileStyle = 'left: ' + leftPos + 'px; top: ' + topPos + 'px; ';
  tileStyle += 'background: ' + color + '; ';
  $('<span/>', {
    id: tileName,
    class: 'tile',
    // text: tileName,
    style: tileStyle
  }).appendTo($mapContainer);
};

var addPixel = function(x, y, e) {
  // var elv = Math.floor(e * 255);
  var biome = makeBiome(e);
  var colorRgb = hexToRgb(biome[1]);
  var leftPos = x * tileW;
  var topPos = y * tileH;
  var imgData = ctx.createImageData(tileW, tileH);
  var length = imgData.data.length;
  for (var i = 0; i < length; i += 4) {
    imgData.data[i + 0] = colorRgb.r;
    imgData.data[i + 1] = colorRgb.g;
    imgData.data[i + 2] = colorRgb.b;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, leftPos, topPos);
};

// Map creation only
// Creates map and store data in arrays
var createMap = function() {
  console.log('Creating map data...');
  var start = Date.now();
  gen = new SimplexNoise();
  for (var y = 0; y < mapHeight; y++) {
    for (var x = 0; x < mapWidth; x++) {
      var nx = x / mapWidth - 0.5, ny = y / mapHeight - 0.5;
      var e = 1 * noise(1 * nx, 1 * ny);
      e += 0.5 * noise(2 * nx, 2 * ny);
      e += 0.25 * noise(4 * nx, 4 * ny);
      e += 0.125 * noise(8 * nx, 8 * ny);
      e /= (1 + 0.5 + 0.25 + 0.125);
      e = Math.pow(e, 1);
      mapElevations[y][x] = e;
    }
  }
  var end = Date.now();
  console.log('Map created in ' + (end - start) + ' ms');
};

// Display map from data in arrays
var displayMap = function() {

  console.log('Building map display...');
  var start = Date.now();

  if (drawMode == 'dom') {
    console.log('Build mode: DOM');
    $mapContainer.show();
    $mapContainer.empty();
    $c.hide();
  } else if (drawMode == 'canvas') {
    console.log('Build mode: Canvas');
    $mapContainer.hide();
    $c.show();
    resizeCanvas();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  for (var y = 0; y < mapHeight; y++) {
    for (var x = 0; x < mapWidth; x++) {
      if (drawMode == 'dom') {
        addTile(x, y, mapElevations[y][x]);
      } else if (drawMode == 'canvas') {
        addPixel(x, y, mapElevations[y][x]);
      }
    }
  }

  var end = Date.now();
  console.log('Map built in ' + (end - start) + ' ms');
};

var display3dMap = function() {

  //var renderer = new THREE.WebGLRenderer({ alpha: true });
  //renderer.setClearColor( 0xffffff, 0);

  $('canvas').remove();

  // flatten arry first


  var width  = window.innerWidth,
      height = window.innerHeight;

  var scene = new THREE.Scene();

  /*
  var axes = new THREE.AxisHelper(200);
  scene.add(axes);
  */

  var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, -70, 50);

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  var geometry = new THREE.PlaneGeometry(60, 60, mapWidth - 1, mapHeight - 1);

  updateVertices(geometry);

  var material = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
    wireframe: true
  });

  var plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  var controls = new THREE.TrackballControls(camera);
  document.getElementById('webgl').appendChild(renderer.domElement);
  render();

  function render() {
    if ( tick >= cycleLength) {
      tick = 0;
      cycle += 1;
      console.log(cycle);
    } else {
      tick += 1;
    }
    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

};

var updateVertices = function(geo) {

  for(var i = 0; i < mapElevations.length; i++) {
    mapElFlat = mapElFlat.concat(mapElevations[i]);
  }
  for (var i = 0, l = geo.vertices.length; i < l; i++) {
    var height = Math.floor(mapElFlat[i]*100);
    height /= 4;
    //height = Math.round(height / 10000 * 2470);
    //console.log(height);
    geo.vertices[i].z = height;
  }
};

// Create empty arrays, maps and display them
var createTerrain = function() {
  createArrays();
  createMap();
  // resizeCanvas();
  // displayMap();
  display3dMap();
  console.log('-----');
};

$('#noise-new').click(function() {
  createTerrain();
  return false;
});

$(function() {
  createTerrain();
});
