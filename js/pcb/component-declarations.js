export function declareResistor(sch, ref, ohm) {
    let partsByOhm={
        330: "C23138",
        4700: "C23162"
    };

    if (!partsByOhm[ohm])
        throw new Error("not found!");

    return sch.declare(ref,{
        symbol: "Device:R",
        footprint: "Resistor_SMD:R_0603_1608Metric",
        lcsc: partsByOhm[ohm]
    });
}

export function declareDiode(sch, ref, type) {
    switch (type.toLowerCase()) {
        case "ss14":
            return sch.declare(ref,{
                symbol: "Device:D",
                footprint: "Diode_SMD:D_SMA",
                lcsc: "C2480"
            });
            break;

        default:
            throw new Error("unknown diode: "+type);
    }
}

export function declareCapacitor(sch, ref, farad) {
    let partsByFarad={
        "47u": "C76659",
        "100n": "C53084461"
    };

    if (!partsByFarad[farad])
        throw new Error("No capacitor for: "+farad);

    // 1206 package
    if (["47u"].includes(farad)) {
        return sch.declare(ref,{
            symbol: "Device:C",
            footprint: "Capacitor_SMD:C_1206_3216Metric",
            lcsc: partsByFarad[farad]
        });
    }

    return sch.declare(ref,{
        symbol: "Device:C",
        footprint: "Capacitor_SMD:C_0603_1608Metric",
        lcsc: partsByFarad[farad]
    });
}

export function declareMalePinHeader(sch, ref, pins) {
    switch (pins) {
        case 2:
            return sch.declare(ref,{
                symbol: "Connector_Generic:Conn_01x02",
                footprint: "Connector_PinSocket_2.54mm:PinSocket_1x02_P2.54mm_Vertical",
                lcsc: "C32713268",
                lcscRot: 90
            });
            break;

        default:
            throw new Error("can't hanlde pins");
    }
}

export function declarePinHeader(sch, ref, pins) {
    switch (pins) {
        case 2:
            return sch.declare(ref,{
                symbol: "Connector_Generic:Conn_01x02",
                footprint: "Connector_PinSocket_2.54mm:PinSocket_1x02_P2.54mm_Vertical",
                lcsc: "C49661",
                lcscRot: 90
            });
            break;

        case 4:
            return sch.declare(ref,{
                symbol: "Connector_Generic:Conn_01x04",
                footprint: "Connector_PinSocket_2.54mm:PinSocket_1x04_P2.54mm_Vertical",
                lcsc: "C2718488",
                lcscRot: 90
            });
            break;

        case 8:
            return sch.declare(ref,{
                symbol: "Connector_Generic:Conn_01x08",
                footprint: "Connector_PinSocket_2.54mm:PinSocket_1x08_P2.54mm_Vertical",
                lcsc: "C27438",
                lcscRot: 90
            });
            break;

        default:
            throw new Error("can't hanlde pins");
    }
}

export function declareScrewTerminal(sch, ref, pins=4) {
    switch (pins) {
        case 4:
            return sch.declare(ref,{
                symbol: "Connector_Generic:Conn_01x04",
                footprint: "Peabrain:ScrewTerminals_4P",
                lcsc: "C441206",
                lcscRot: -90,
            });
            break;

        default:
            throw new Error("unknown");
    }
}

export function declareEsp32(sch, ref1, ref2) {
    let ESP32SUPERMINI_PINNAMES=[
        "gpio5","gpio6","gpio7","gpio8",
        "gpio9","gpio10","gpio20","gpio21",
        "gpio0","gpio1","gpio2","gpio3",
        "gpio4","_3v3","gnd","_5v",
    ];

    let u1=declarePinHeader(sch,ref1,8);
    let u2=declarePinHeader(sch,ref2,8);

    return compoundSymbol(u1,u2).namePins(ESP32SUPERMINI_PINNAMES);
}

export function declareTja1050(sch, ref1, ref2) {
    let TJA1050_PINNAMES=[
        "vcc","tx","rx","gnd",
        "n/a","canl","canh","n/a"
    ];

    let u1=declarePinHeader(sch,ref1,4);
    let u2=declarePinHeader(sch,ref2,4);

    return compoundSymbol(u1,u2).namePins(TJA1050_PINNAMES);
}

export function declareDrv8825(sch, ref1, ref2) {
    let pinNames=[
        "en","m0","m1","m2",
        "rst","slp","step","dir",
        "gnd1","fault","a2","a1",
        "b1","b2","gnd2","vmot"
    ];

    let u1=declarePinHeader(sch,ref1,8);
    let u2=declarePinHeader(sch,ref2,8);

    return compoundSymbol(u1,u2).namePins(pinNames);
}

export function declareMp1584(sch, ref1, ref2, ref3, ref4) {
    let u1=declarePinHeader(sch,ref1,2);
    let u2=declarePinHeader(sch,ref2,2);
    let u3=declarePinHeader(sch,ref3,2);
    let u4=declarePinHeader(sch,ref4,2);

    u1.pin(1).connect(u1.pin(2));
    u2.pin(1).connect(u2.pin(2));
    u3.pin(1).connect(u3.pin(2));
    u4.pin(1).connect(u4.pin(2));

    return ({
        gndout: u1.pin(1),
        gndin: u2.pin(1),
        vin: u3.pin(1),
        vout: u4.pin(1),
    });
}