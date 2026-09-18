using Toybox.Activity as Activity;
using Toybox.ActivityRecording as ActivityRecording;
using Toybox.Application as Application;
using Toybox.Attention as Attention;
using Toybox.Graphics as Graphics;
using Toybox.Lang as Lang;
using Toybox.Math as Math;
using Toybox.Timer as Timer;
using Toybox.WatchUi as WatchUi;

class IliaCoachView extends WatchUi.View {
    const MODE_HOME = 0;
    const MODE_WORKOUT = 1;
    const MODE_RUN = 2;

    var _mode = MODE_HOME;
    var _homeSelection = 0;

    var _exerciseIndex = 0;
    var _setIndex = 0;
    var _restRemaining = 0;

    var _timer;
    var _runSession = null;
    var _runCue = "READY";
    var _lastCue = "";
    var _cueCooldown = 0;

    function initialize() {
        View.initialize();
        _timer = new Timer.Timer();
        _timer.start(method(:onTick), 1000, true);
    }

    function onShow() {
        WatchUi.requestUpdate();
    }

    function onHide() {
    }

    function onTick() {
        if (_restRemaining > 0) {
            _restRemaining -= 1;
        }

        if (_cueCooldown > 0) {
            _cueCooldown -= 1;
        }

        if (_mode == MODE_RUN && isRunRecording()) {
            updateRunCue();
        }

        WatchUi.requestUpdate();
    }

    function onUpdate(dc) {
        dc.setColor(0xF7F7F2, 0x07120D);
        dc.clear();

        if (_mode == MODE_HOME) {
            drawHome(dc);
        } else if (_mode == MODE_WORKOUT) {
            drawWorkout(dc);
        } else {
            drawRun(dc);
        }
    }

    function drawHeader(dc, title, kicker) {
        dc.setColor(0x98A39B, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 26, Graphics.FONT_XTINY, kicker, Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(0xF7F7F2, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 60, Graphics.FONT_TINY, title, Graphics.TEXT_JUSTIFY_CENTER);
    }

    function drawHome(dc) {
        var app = Application.getApp() as IliaCoachApp;
        var plan = app.getPlan();
        var title = plan["title"];

        drawHeader(dc, "ILIA COACH", "WATCH COMPANION");

        dc.setColor(0xC6FF31, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 116, Graphics.FONT_XTINY, "TODAY", Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(0xF4EFE4, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 151, Graphics.FONT_XTINY, title, Graphics.TEXT_JUSTIFY_CENTER);

        var duration = plan["duration"];
        dc.setColor(0x8D988F, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 184, Graphics.FONT_XTINY, duration.toString() + " min", Graphics.TEXT_JUSTIFY_CENTER);

        drawHomeRow(dc, 224, "START WORKOUT", 0);
        drawHomeRow(dc, 274, "RUN COACH", 1);
        drawHomeRow(dc, 324, "SYNC PHONE", 2);

        dc.setColor(0x6F7C73, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 370, Graphics.FONT_XTINY, app.getSyncStatus(), Graphics.TEXT_JUSTIFY_CENTER);
    }

    function drawHomeRow(dc, y, label, index) {
        var selected = (_homeSelection == index);
        dc.setColor(selected ? 0xC6FF31 : 0x153024, Graphics.COLOR_TRANSPARENT);
        dc.fillRoundedRectangle(62, y - 5, 266, 42, 18);

        dc.setColor(selected ? 0x07120D : 0xF7F7F2, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, y, Graphics.FONT_XTINY, label, Graphics.TEXT_JUSTIFY_CENTER);
    }

    function drawWorkout(dc) {
        var plan = (Application.getApp() as IliaCoachApp).getPlan();
        var exercises = plan["exercises"];
        var total = exercises.size();

        if (total == 0) {
            drawHeader(dc, "NO EXERCISES", "TODAY");
            return;
        }

        if (_exerciseIndex >= total) {
            _exerciseIndex = total - 1;
        }

        var ex = exercises[_exerciseIndex];
        var sets = ex["sets"];
        var currentSet = _setIndex + 1;
        if (currentSet > sets) {
            currentSet = sets;
        }

        drawHeader(dc, "WORKOUT", (_exerciseIndex + 1).toString() + " / " + total.toString());

        dc.setColor(0xC6FF31, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 120, Graphics.FONT_XTINY, ex["name"], Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(0xF4EFE4, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 164, Graphics.FONT_TINY, "SET " + currentSet.toString() + " / " + sets.toString(), Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(0x8D988F, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 215, Graphics.FONT_XTINY, ex["reps"] + " reps", Graphics.TEXT_JUSTIFY_CENTER);

        if (_restRemaining > 0) {
            dc.setColor(0xFFAE3D, Graphics.COLOR_TRANSPARENT);
            dc.drawText(195, 262, Graphics.FONT_TINY, formatClock(_restRemaining), Graphics.TEXT_JUSTIFY_CENTER);
            dc.setColor(0x8D988F, Graphics.COLOR_TRANSPARENT);
            dc.drawText(195, 307, Graphics.FONT_XTINY, "REST - tap to skip", Graphics.TEXT_JUSTIFY_CENTER);
        } else {
            dc.setColor(0xC6FF31, Graphics.COLOR_TRANSPARENT);
            dc.fillRoundedRectangle(60, 255, 270, 58, 22);
            dc.setColor(0x07120D, Graphics.COLOR_TRANSPARENT);
            dc.drawText(195, 267, Graphics.FONT_XTINY, "COMPLETE SET", Graphics.TEXT_JUSTIFY_CENTER);
        }

        dc.setColor(0x6F7C73, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 350, Graphics.FONT_XTINY, "SWIPE = EXERCISE  |  BACK = HOME", Graphics.TEXT_JUSTIFY_CENTER);
    }

    function drawRun(dc) {
        var info = Activity.getActivityInfo();
        var pace = currentPaceSeconds(info);
        var distance = 0.0;
        var hr = 0;

        if (info != null) {
            if (info.elapsedDistance != null) {
                distance = Math.round((info.elapsedDistance / 1000.0) * 100.0) / 100.0;
            }
            if (info.currentHeartRate != null) {
                hr = info.currentHeartRate;
            }
        }

        drawHeader(dc, "RUN COACH", isRunRecording() ? "RECORDING" : "READY");

        dc.setColor(0xC6FF31, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 118, Graphics.FONT_NUMBER_MILD, pace == null ? "--:--" : formatPace(pace), Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(0x8D988F, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 194, Graphics.FONT_XTINY, "PACE / KM", Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(0xF4EFE4, Graphics.COLOR_TRANSPARENT);
        dc.drawText(118, 230, Graphics.FONT_XTINY, distance.toString() + " km", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(272, 230, Graphics.FONT_XTINY, hr.toString() + " bpm", Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(cueColor(), Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 277, Graphics.FONT_TINY, _runCue, Graphics.TEXT_JUSTIFY_CENTER);

        dc.setColor(isRunRecording() ? 0xFF5A5F : 0xC6FF31, Graphics.COLOR_TRANSPARENT);
        dc.fillRoundedRectangle(70, 329, 250, 48, 20);
        dc.setColor(0x07120D, Graphics.COLOR_TRANSPARENT);
        dc.drawText(195, 337, Graphics.FONT_XTINY, isRunRecording() ? "STOP + SAVE" : "START RUN", Graphics.TEXT_JUSTIFY_CENTER);
    }

    function handleSelect() {
        if (_mode == MODE_HOME) {
            if (_homeSelection == 0) {
                _mode = MODE_WORKOUT;
                _exerciseIndex = 0;
                _setIndex = 0;
                _restRemaining = 0;
            } else if (_homeSelection == 1) {
                _mode = MODE_RUN;
            } else {
                (Application.getApp() as IliaCoachApp).requestSync();
            }
        } else if (_mode == MODE_WORKOUT) {
            completeWorkoutSet();
        } else {
            toggleRun();
        }

        WatchUi.requestUpdate();
        return true;
    }

    function handleNext() {
        if (_mode == MODE_HOME) {
            _homeSelection = (_homeSelection + 1) % 3;
        } else if (_mode == MODE_WORKOUT) {
            moveExercise(1);
        }
        WatchUi.requestUpdate();
        return true;
    }

    function handlePrevious() {
        if (_mode == MODE_HOME) {
            _homeSelection -= 1;
            if (_homeSelection < 0) {
                _homeSelection = 2;
            }
        } else if (_mode == MODE_WORKOUT) {
            moveExercise(-1);
        }
        WatchUi.requestUpdate();
        return true;
    }

    function handleMenu() {
        if (_mode == MODE_WORKOUT && _restRemaining > 0) {
            _restRemaining = 0;
            WatchUi.requestUpdate();
            return true;
        }
        return false;
    }

    function handleBack() {
        if (_mode != MODE_HOME) {
            _mode = MODE_HOME;
            WatchUi.requestUpdate();
            return true;
        }
        return false;
    }

    function moveExercise(delta) {
        var plan = (Application.getApp() as IliaCoachApp).getPlan();
        var exercises = plan["exercises"];
        var next = _exerciseIndex + delta;

        if (next < 0) {
            next = 0;
        }
        if (next >= exercises.size()) {
            next = exercises.size() - 1;
        }

        _exerciseIndex = next;
        _setIndex = 0;
        _restRemaining = 0;
    }

    function completeWorkoutSet() {
        if (_restRemaining > 0) {
            _restRemaining = 0;
            return;
        }

        var plan = (Application.getApp() as IliaCoachApp).getPlan();
        var exercises = plan["exercises"];
        var ex = exercises[_exerciseIndex];
        var sets = ex["sets"];

        _setIndex += 1;

        if (_setIndex >= sets) {
            if (_exerciseIndex + 1 < exercises.size()) {
                _exerciseIndex += 1;
                _setIndex = 0;
            } else {
                _mode = MODE_HOME;
                _exerciseIndex = 0;
                _setIndex = 0;
                _restRemaining = 0;
                vibrate(80, 500);
                return;
            }
        }

        var rest = ex["rest"];
        if (rest != null) {
            _restRemaining = rest;
        }

        vibrate(45, 180);
    }

    function toggleRun() {
        if (!isRunRecording()) {
            try {
                _runSession = ActivityRecording.createSession({
                    :name => "ILIA Run",
                    :sport => Activity.SPORT_RUNNING,
                    :subSport => Activity.SUB_SPORT_GENERIC
                });
                _runSession.start();
                _runCue = "HOLD TARGET";
                _lastCue = _runCue;
                vibrate(60, 250);
            } catch (e) {
                _runSession = null;
                _runCue = "START FAILED";
            }
        } else {
            try {
                _runSession.stop();
                _runSession.save();
            } catch (e) {
            }
            _runSession = null;
            _runCue = "SAVED";
            vibrate(80, 350);
        }
    }

    function isRunRecording() {
        return _runSession != null && _runSession.isRecording();
    }

    function updateRunCue() {
        var info = Activity.getActivityInfo();
        var pace = currentPaceSeconds(info);

        if (pace == null) {
            _runCue = "GPS / PACE...";
            return;
        }

        var plan = (Application.getApp() as IliaCoachApp).getPlan();
        var target = 310;
        if (plan["run"] != null && plan["run"]["targetPaceSec"] != null) {
            target = plan["run"]["targetPaceSec"];
        }

        var delta = pace - target;
        if (delta > 10) {
            _runCue = "SPEED UP";
        } else if (delta < -10) {
            _runCue = "SLOW DOWN";
        } else {
            _runCue = "ON PACE";
        }

        if (_runCue != _lastCue && _cueCooldown == 0) {
            vibrate(_runCue == "ON PACE" ? 35 : 70, _runCue == "ON PACE" ? 150 : 300);
            _lastCue = _runCue;
            _cueCooldown = 20;
        }
    }

    function currentPaceSeconds(info) {
        if (info == null || info.currentSpeed == null || info.currentSpeed < 0.5) {
            return null;
        }
        return Math.round(1000.0 / info.currentSpeed);
    }

    function cueColor() {
        if (_runCue == "SPEED UP") {
            return 0xFFAE3D;
        }
        if (_runCue == "SLOW DOWN") {
            return 0xFF5A5F;
        }
        if (_runCue == "ON PACE" || _runCue == "HOLD TARGET") {
            return 0x3AD46F;
        }
        return 0xC6FF31;
    }

    function formatClock(seconds) {
        var min = seconds / 60;
        var sec = seconds % 60;
        var secText = sec < 10 ? "0" + sec.toString() : sec.toString();
        return min.toString() + ":" + secText;
    }

    function formatPace(seconds) {
        var min = seconds / 60;
        var sec = seconds % 60;
        var secText = sec < 10 ? "0" + sec.toString() : sec.toString();
        return min.toString() + ":" + secText;
    }

    function vibrate(power, ms) {
        if (Toybox has :Attention && Attention has :vibrate) {
            try {
                Attention.vibrate([ new Attention.VibeProfile(power, ms) ]);
            } catch (e) {
            }
        }
    }
}
