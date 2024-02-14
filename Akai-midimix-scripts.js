// eslint-disable-next-line no-var
var MidiMixController = {};
MidiMixController.shift = false;

MidiMixController.init = function (id, debugging) {
    // flash all LEDs
    this.value = 0;
    
    function flashyOn() {
        midi.sendShortMsg(0x90, this.value, 0x7f);
        this.value++;
        if(this.value == 27) {
            engine.beginTimer(250, flashyOff, true);
            return;
        }
        engine.beginTimer(85, flashyOn, true);
    }
    engine.beginTimer(0, flashyOn, true);
    
    function flashyOff() {
        midi.sendShortMsg(0x90, this.value, 0x00);
        this.value--;
        if(this.value == 0) {
            this.value = 1;
            return;
        }
        engine.beginTimer(50, flashyOff, true);
    }
    
    
    for (var i = 1; i <= 16; ++i) {
        engine.makeConnection("[Sampler" + i + "]", "play", MidiMixController.samplerPlayOutputCallbackFunction);
    }
    
    // Turn all the effects units in the rack on
    for (var i = 1; i <= 4; ++i) {
        for (var j = 1; j <= 3; ++j) {
            engine.setValue("[EffectRack1_EffectUnit"+i+"_Effect"+j+"]", "enabled", 1);
        }
    }
    
    engine.makeConnection("[Channel1]", "play", MidiMixController.channelPlayOutputCallbackFunction);
    engine.makeConnection("[Channel2]", "play", MidiMixController.channelPlayOutputCallbackFunction);
}
MidiMixController.channelPlayOutputCallbackFunction = function(value, group, control) {
    var isPlaying = engine.getValue(group, "play") === 1;
    
    switch(group) {
        case "[Channel1]":
            if (!isPlaying) {
                midi.sendShortMsg(0x90, 0x01, 0x00);
            } else {
                midi.sendShortMsg(0x90, 0x01, 0x7f);
            }
            break;
        case "[Channel2]":
            if (!isPlaying) {
                midi.sendShortMsg(0x90, 0x16, 0x00);
            } else {
                midi.sendShortMsg(0x90, 0x16, 0x7f);
            }
            break;
    }
}
MidiMixController.samplerPlayOutputCallbackFunction = function(value, group, control) {
    var isPlaying = engine.getValue(group, "play") === 1;

    if (!isPlaying) {
        switch(group) {
            case "[Sampler1]":
                midi.sendShortMsg(0x90, 0x03, 0x00);
                break;
            case "[Sampler2]":
                midi.sendShortMsg(0x90, 0x06, 0x00);
                break;
            case "[Sampler3]":
                midi.sendShortMsg(0x90, 0x09, 0x00);
                break;
            case "[Sampler4]":
                midi.sendShortMsg(0x90, 0x0C, 0x00);
                break;
            case "[Sampler5]":
                midi.sendShortMsg(0x90, 0x0F, 0x00);
                break;
            case "[Sampler6]":
                midi.sendShortMsg(0x90, 0x12, 0x00);
                break;
            case "[Sampler7]":
                midi.sendShortMsg(0x90, 0x15, 0x00);
                break;
            case "[Sampler8]":
                midi.sendShortMsg(0x90, 0x18, 0x00);
                break;
        }
    }
};

MidiMixController.shutdown = function() {
    // turn off all LEDs
    for (var i = 1; i <= 27; i++) {
        midi.sendShortMsg(0x90, i, 0x00);
    }
}

MidiMixController.lightsOff = function() {
//     midi.sendShortMsg(0x90, 1, 0x00);
//     midi.sendShortMsg(0x90, 4, 0x00);
//     midi.sendShortMsg(0x90, 7, 0x00);
//     midi.sendShortMsg(0x90, 10, 0x00);
//     midi.sendShortMsg(0x90, 13, 0x00);
//     midi.sendShortMsg(0x90, 16, 0x00);
//     midi.sendShortMsg(0x90, 19, 0x00);
//     midi.sendShortMsg(0x90, 22, 0x00);
    midi.sendShortMsg(0x90, 25, 0x00);
    midi.sendShortMsg(0x90, 26, 0x00);
}
MidiMixController.shiftOff = function() {
    MidiMixController.lightsOff();
    MidiMixController.shift = false;
}
MidiMixController.shiftOn = function() {
//     midi.sendShortMsg(0x90, 1, 0x7f);
//     midi.sendShortMsg(0x90, 4, 0x7f);
//     midi.sendShortMsg(0x90, 7, 0x7f);
//     midi.sendShortMsg(0x90, 10, 0x7f);
//     midi.sendShortMsg(0x90, 13, 0x7f);
//     midi.sendShortMsg(0x90, 16, 0x7f);
//     midi.sendShortMsg(0x90, 19, 0x7f);
//     midi.sendShortMsg(0x90, 22, 0x7f);
    midi.sendShortMsg(0x90, 25, 0x7f);
    midi.sendShortMsg(0x90, 26, 0x7f);
    MidiMixController.shift = true;
}

MidiMixController.shiftButton = function(channel, control, value, status, group) {
    MidiMixController.shift = ! MidiMixController.shift;
    if(MidiMixController.shift) {
        MidiMixController.shiftOn();
    } else {
        MidiMixController.shiftOff();
    }
}

MidiMixController.moveUpOrLoadDeck1 = function(_channel, _control, value, _status, group) {
    if(value === 127) { // only do stuff when button is pressed, not when released
        if(MidiMixController.shift) {
            // when shifted
            engine.setValue("[Channel1]", "LoadSelectedTrack", 1.0);
        } else {
            // when not shifted
            engine.setValue("[Library]", "MoveUp", value);
        }
    }
}

MidiMixController.moveDownOrLoadDeck2 = function(_channel, _control, value, _status, group) {
    if(value === 127) { // only do stuff when button is pressed, not when released
        if(MidiMixController.shift) {
            // when shifted
            engine.setValue("[Channel2]", "LoadSelectedTrack", 1.0);
        } else {
            // when not shifted
            engine.setValue("[Library]", "MoveDown", value);
        }
    }
}


MidiMixController.samplerPadPressed = function(_channel, control, value, _status, group) {
    if(MidiMixController.shift) {
        if (engine.getValue(group, "play")) {
            engine.setValue(group, "cue_gotoandstop", value);
            midi.sendShortMsg(0x90, control, 0x0);
        }
        
        MidiMixController.shiftOff();
    } else {
        if (engine.getValue(group, "track_loaded")) {
            engine.setValue(group, "cue_gotoandplay", value);
            midi.sendShortMsg(0x90, control, 0x7f);
        }
    }
};
