if (global.canBus) {
	global.getMasterDevice=()=>{
		if (!global.__instance_MasterDevice)
			global.__instance_MasterDevice=new MasterDevice(canBus);

		return global.__instance_MasterDevice;
	}
}
