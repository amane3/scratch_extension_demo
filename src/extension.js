(function(ext){
    var device = null;
    var rawData = null;
    var connected = false;
    var poller = null;
    var parsingMsg = false;
    var msgBytesRead = 0;
        
    var READ_PIN = 1;
    var ANALOG_WRITE = 2;
    var DIGITAL_WRITE = 3;
        
    var START_MSG = 0xF0,
        END_MSG = 0xF7;
	
    var pingCmd = new Uint8Array(1);
        pingCmd[0] = READ_PIN;
	
    // put datas from board
    var inputs = {
        "temp": 0,
	"something" :0
    };
    // names of inputs
    var names = new Array() ;
     names[0] = "temp";
     names[1] = "something";

    inputArray = [];

    function processMsg(){
    }
    
    // making array of output datas
    function processInput() {
        for (var i=0; i < rawData.length; i++) {
            if (parsingMsg) {
              if (rawData[i] == END_MSG) {   // parsing ends at here
                parsingMsg = false;
              }else{
		inputs[names[i-1]] = rawData[i];  // update array datas
              }
            } else {
              if (rawData[i] == START_MSG) {  // parsing starts at here
                parsingMsg = true;
                msgBytesRead = 0;
              }
            }
          }
        rawData = null;
    }
    
    function numRange(num){
          if(num<0){
              return 0;
          }else if(num>255){
              return 255;
          }else{
              return 255-num;
          }
    }   
	

    ext.log_test = function(str) {
        // log alert
        alert(device);
    };
    
    ext.turnOn = function(r,g,b) {
        // turnOn LED
        var buf = new Uint8Array(5);
        buf[0] = ANALOG_WRITE;
        buf[1] = 1;
        buf[2] = Math.floor(numRange(r)/100);
        buf[3] = Math.floor((numRange(r)%100)/10);
        buf[4] = (numRange(r)%100)%10;
        buf[5] = Math.floor(numRange(g)/100);
        buf[6] = Math.floor((numRange(g)%100)/10);
        buf[7] = (numRange(g)%100)%10;
        buf[8] = Math.floor(numRange(b)/100);
        buf[9] = Math.floor((numRange(b)%100)/10);
        buf[10] = (numRange(b)%100)%10;
        device.send(buf.buffer);
    };
    
    ext.turnOff = function(str) {
        // turnOff LED
        var buf = new Uint8Array(2);
        buf[0] = ANALOG_WRITE;
        buf[1] = 0;
        device.send(buf.buffer);
    };
    
    ext.blink = function(color) {
        // blink LED
        var buf = new Uint8Array(3);
        buf[0] = ANALOG_WRITE;
        buf[1] = 2;
        if(color == 'RED'){
          buf[2] = 0;
        }else if(color == 'GREEN'){
          buf[2] = 1;
        }else{
          buf[2] = 2;
        }
        device.send(buf.buffer);
    };
    
    ext.ChangingColor = function(str){
        // Changing LED colors
        var buf = new Uint8Array(2);
        buf[0] = ANALOG_WRITE;
        buf[1] = 3;
        device.send(buf.buffer);
    };
    
    
    ext.setLED = function(str) {
    // do something
    };
    
    ext._getStatus = function() {
        if(!device) return {status: 1, msg: 'Device not connected'};
        return {status: 2, msg: 'Device connected'};
    };
    
    ext._deviceRemoved = function(dev) {
        // Not currently implemented with serial devices
    };
    
    ext.istilted = function(str) {
    // do something
    };
    
    ext.whenTilted = function(str) {
    // do something
    };
	
    ext.Gettiltx = function(str) {
    };
	
    ext.Gettilty = function(str) {
    // do something
    };
	
    ext.Gettiltz = function(str) {
    // do something
    };

    ext.Getrgb = function(str) {
    }
    
    ext.Gettemp = function() {
    	return inputs["temp"];
    };

    ext.isTemp = function(num) {
    	return inputs["temp"] === num;
    };
	
    ext.isTemplow = function(num) {
    	return inputs["temp"] < num;
    };
	
    ext.isTemphigh = function(num) {
    	return inputs["temp"] > num;
    };


     var poller = null;
  ext._deviceConnected = function(dev) {
    sendAttempts = 0;
    connected = true;
    if (device) return;
	  
    function appendBuffer( buffer1, buffer2 ) {
        var tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength );
        tmp.set( new Uint8Array( buffer1 ), 0 );
        tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength );
        return tmp.buffer;
    }
    
    device = dev;
    device.open({ stopBits: 0, bitRate: 9600, ctsFlowControl: 0 }, function(){
        device.set_receive_handler(function(data) {
	 if(!rawData || rawData.byteLength == 3) rawData = new Uint8Array(data);
            else rawData = appendBuffer(rawData, data);
            // when rawData is added more than 3bytes processInput function is called
            if(rawData.byteLength >= 3) {
                //console.log(rawData);
                processInput();
                //device.send(pingCmd.buffer);
            }
    	  
       });  
    }); 

    poller = setInterval(function() {
   
      sendAttempts++;
      device.send(pingCmd.buffer);  // send READ_PIN buffer every 1000ms
    }, 1000);

  };

    ext._deviceRemoved = function (dev) {
        if (device != dev) return;
        if (poller) poller = clearInterval(poller);
        device = null;
    };

    ext._shutdown = function() {
       if (device) device.close();
       if (poller) clearInterval(poller);
       device = null;
    };
    
    
    var blocks = [
         [' ','Connected Device','log_test'],
         [' ','set light x:%d.rowcol y:%d.rowcol %m.ledState','setLED',1,1,'on'], 
         [' ','R %n G %n B %n turn on LED','turnOn',0,0,0],
         [' ','turn off LED','turnOff'],
         [' ','Blink LED%m.colors','blink','RED'],
         [' ','Changing LED colors','ChangingColor'],
         ['h', 'when tilted %m.dirs', 'whenTilted', 'any'],
	 ['b','is temp %n','isTemp',1],
	 ['b','is temp < %n','isTemplow',1],
	 ['b','is temp > %n','isTemphigh',1],
	 ['r','Get temperature','Gettemp'],
         ['r','Get tilt X','Gettiltx'],
	 ['r','Get tilt Y','Gettilty'],
	 ['r','Get tilt Z','Gettiltz'],
         ['b','is%m.dirs?','isTilted','any'], 
         [' ','Get LED Value %m.RGB','Getrgb','ledr'],
      ];
    
    var menus = {
       dirs: ['any', 'right', 'left', 'up', 'down'],
       rowcol:[1,2,3,4,5,'random'],
       colors:['RED','GREEN','BLUE'],
       RGB:['ledr','ledg','ledb'],
    };
    
    var descriptor = {
       blocks:blocks,
       menus:menus,
    };
    
    var serial_info = {type: 'serial'};
    ScratchExtensions.register('Arduino', descriptor, ext, serial_info);
    
    })({});
