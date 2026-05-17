import {declareResistor, declarePinHeader, declareEsp32,
		declareTja1050, declareScrewTerminal, declareDrv8825,
		declareMp1584, declareCapacitor, declareMalePinHeader,
		declareDiode} from "../../js/pcb/component-declarations.js";

export default async function(sch, {variant}) {
	let screw1 = declareScrewTerminal(sch,"J1");
	let screw2 = declareScrewTerminal(sch,"J2");
	let esp32 = declareEsp32(sch,"U1","U2");
	let tja1050 = declareTja1050(sch,"U3","U4");
	let mp1584 = declareMp1584(sch,"U5","U6","U7","U8");
	let d1=declareDiode(sch,"D1","ss14");
	let r1 = declareResistor(sch,"R1",4700);
	let j5=declareMalePinHeader(sch,"J5",2);
	let r4=declareResistor(sch,"R4",330);

	// power
	mp1584.vin.connect("12V");
	mp1584.gndin.connect("GND");
	mp1584.gndout.connect("GND");
	d1.connect("5V",mp1584.vout);

	// mcu
	esp32._5v.connect("5V");
	esp32._3v3.connect("3V3");
	esp32.gnd.connect("GND");

	// can
	tja1050.vcc.connect("5V");
	tja1050.tx.connect(esp32.gpio5);
	r1.connect(tja1050.rx,esp32.gpio4);
	tja1050.gnd.connect("GND");
	tja1050.canl.connect("CANL");
	tja1050.canh.connect("CANH");

	// led
	j5.pin(1).connect("3V3");
	r4.connect(esp32.gpio8,j5.pin(2));

	// screw
	screw1.connect("GND","12V","CANH","CANL");
	screw2.connect("GND","12V","CANH","CANL");
}