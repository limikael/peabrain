import {declareResistor, declarePinHeader, declareEsp32,
		declareTja1050, declareScrewTerminal, declareDrv8825,
		declareMp1584, declareCapacitor, declareMalePinHeader,
		declareDiode} from "../../js/pcb/component-declarations.js";

export default async function(sch, {variant}) {
	let screw1 = declareScrewTerminal(sch,"J1");
	let screw2 = declareScrewTerminal(sch,"J2");
	let screw3 = declareScrewTerminal(sch,"J3");
	let screw4 = declareScrewTerminal(sch,"J4");

	let esp32 = declareEsp32(sch,"U1","U2");
	let tja1050 = declareTja1050(sch,"U3","U4");
	let mp1584 = declareMp1584(sch,"U5","U6","U7","U8");
	let drv8825 = declareDrv8825(sch,"U9","U10");

	let r1 = declareResistor(sch,"R1",4700);
	let c1 = declareCapacitor(sch,"C1","47u");

	// limit switch components
	let r2 = declareResistor(sch,"R2",4700);
	let r3 = declareResistor(sch,"R3",4700);
	let c2 = declareCapacitor(sch,"C2","100n");
	let c3 = declareCapacitor(sch,"C3","100n");

	// status LED
	let j5=declareMalePinHeader(sch,"J5",2);
	let r4=declareResistor(sch,"R4",330);

	// Power oring
	let d1=declareDiode(sch,"D1","ss14");

	j5.pin(1).connect("3V3");
	r4.connect(esp32.gpio8,j5.pin(2));

	screw1.connect("GND","12V","CANH","CANL");
	screw2.connect("GND","VMOT","","");

	// J3: GND, SW1, GND, SW2 (signals left unnamed)
	screw3.connect("GND","","GND","");

	esp32._5v.connect("5V");
	esp32._3v3.connect("3V3");
	esp32.gnd.connect("GND");

	tja1050.vcc.connect("5V");
	tja1050.tx.connect(esp32.gpio5);
	r1.connect(tja1050.rx,esp32.gpio4);
	tja1050.gnd.connect("GND");
	tja1050.canl.connect("CANL");
	tja1050.canh.connect("CANH");

	drv8825.en.connect(esp32.gpio6);
	drv8825.m0.connect(esp32.gpio0);
	drv8825.m1.connect(esp32.gpio1);
	drv8825.m2.connect(esp32.gpio3);
	drv8825.rst.connect("3V3");
	drv8825.slp.connect("3V3");
	drv8825.step.connect(esp32.gpio9);
	drv8825.dir.connect(esp32.gpio10);

	drv8825.gnd1.connect("GND");
	drv8825.fault.connect(esp32.gpio21);
	drv8825.a2.connect(screw4.pin(1));
	drv8825.a1.connect(screw4.pin(2));
	drv8825.b1.connect(screw4.pin(3));
	drv8825.b2.connect(screw4.pin(4));
	drv8825.gnd2.connect("GND");
	drv8825.vmot.connect("VMOT");

	c1.connect("VMOT","GND");

	// --- Limit switch SW1 (GPIO7) ---
	let sw1 = screw3.pin(2);
	r2.connect("3V3", sw1);
	c2.connect(sw1, "GND");
	esp32.gpio7.connect(sw1);

	// --- Limit switch SW2 (GPIO20) ---
	let sw2 = screw3.pin(4);
	r3.connect("3V3", sw2);
	c3.connect(sw2, "GND");
	esp32.gpio20.connect(sw2);

	mp1584.vin.connect("12V");
	mp1584.gndin.connect("GND");
	mp1584.gndout.connect("GND");
	d1.connect("5V",mp1584.vout);
}