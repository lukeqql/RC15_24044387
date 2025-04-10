
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>

LiquidCrystal_I2C mylcd(0x27,16,2);
DHT dht2(2, 11);
TinyGPSPlus gps;
SoftwareSerial gps_ss(10, 11);

void setup(){
  mylcd.init();
  mylcd.backlight();
   dht2.begin();
  gps_ss.begin(9600);
  Serial.begin(9600);
}

void loop(){
  mylcd.setCursor(1-1, 1-1);
  mylcd.print(String(String("T:") + String(String(dht2.readTemperature()).toInt()) + String("C---")) + String(String("H:") + String(String(dht2.readHumidity()).toInt()) + String("%")));

  while (gps_ss.available()) {
    if (gps.encode(gps_ss.read())) {
      if (gps.location.isValid()) {
        Serial.println(gps.location.lat());
        Serial.println(gps.location.lng());
        mylcd.setCursor(1-1, 2-1);
        mylcd.print(String("N:") + String(gps.location.lat()) + String(String("-E:") + String(gps.location.lng())));

      }

    }
  }

  "";

  "B";

  "C";

}