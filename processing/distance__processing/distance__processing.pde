import oscP5.*;
import netP5.*;

OscP5 oscP5;
float x = 0;
int squareColor = 255;

String distanceAddress = "/tinkamo/distance";
String buttonAddress = "/tinkamo/button";

void setup() {
  background(255);
  size(400, 400);
  
  oscP5 = new OscP5( this , 4445, OscP5.UDP);
}

void draw() {
  background(255);
  fill(squareColor);
  rect(200, 200, x, x);
}

void oscEvent(OscMessage m) {
  String newAddress = m.addrPattern();
  if (newAddress.equals(distanceAddress)) {
    x = (m.get(0).floatValue()) * 5;
  }
  if (newAddress.equals(buttonAddress)) {
    int buttonState = m.get(0).intValue();
    if (buttonState == 0) {
      squareColor = int(random(0, 255));
    }
  }
}
