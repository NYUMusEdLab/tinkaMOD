import oscP5.*;
import netP5.*;

OscP5 oscP5;
float x = 0;

String distanceAddress = "/tinkamo/distance";

void setup() {
  background(255);
  size(400, 400);
  
  oscP5 = new OscP5( this , 4445, OscP5.UDP);
}

void draw() {
  background(255);
  rect(200, 200, x, x);
}

void oscEvent(OscMessage m) {
  String newAddress = m.addrPattern();
  if (newAddress.equals(distanceAddress)) {
    x = (m.get(0).floatValue()) * 5;
  }
}
