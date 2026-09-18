using Toybox.Application as Application;
using Toybox.Communications as Communications;
using Toybox.WatchUi as WatchUi;

class IliaCoachApp extends Application.AppBase {
    var _plan;
    var _syncStatus = "READY";

    function initialize() {
        AppBase.initialize();
        loadPlan();
    }

    function onStart(state) {
        if (Communications has :registerForPhoneAppMessages) {
            Communications.registerForPhoneAppMessages(method(:onPhoneMessage));
        }
    }

    function onStop(state) {
    }

    function getInitialView() {
        var view = new IliaCoachView();
        return [ view, new IliaCoachDelegate(view) ];
    }

    function loadPlan() {
        var stored = Application.Storage.getValue("todayPlan");
        if (stored != null) {
            _plan = stored;
        } else {
            _plan = defaultPlan();
        }
    }

    function defaultPlan() {
        return {
            "title" => "Lower Strength",
            "duration" => 45,
            "exercises" => [
                { "name" => "45 Leg Press", "sets" => 4, "reps" => "8-12", "rest" => 90 },
                { "name" => "Step-Up", "sets" => 3, "reps" => "10 / side", "rest" => 75 },
                { "name" => "Hip Thrust", "sets" => 4, "reps" => "8-12", "rest" => 90 },
                { "name" => "Hamstring Curl", "sets" => 3, "reps" => "10-15", "rest" => 75 },
                { "name" => "Calf Raise", "sets" => 3, "reps" => "12-15", "rest" => 60 }
            ],
            "run" => {
                "distanceKm" => 10.0,
                "targetPaceSec" => 310
            }
        };
    }

    function getPlan() {
        return _plan;
    }

    function getSyncStatus() {
        return _syncStatus;
    }

    function requestSync() {
        _syncStatus = "SYNCING";
        WatchUi.requestUpdate();

        if (!(Toybox has :Communications)) {
            _syncStatus = "NO PHONE LINK";
            WatchUi.requestUpdate();
            return;
        }

        try {
            Communications.transmit(
                {
                    "type" => "sync_request",
                    "app" => "ILIA_COACH",
                    "version" => "0.1.0"
                },
                {},
                new IliaConnectionListener()
            );
        } catch (e) {
            _syncStatus = "PHONE OFFLINE";
            WatchUi.requestUpdate();
        }
    }

    function onPhoneMessage(message) {
        if (message == null || message.data == null) {
            return;
        }

        var data = message.data;
        if (data["type"] == "plan" && data["plan"] != null) {
            _plan = data["plan"];
            Application.Storage.setValue("todayPlan", _plan);
            _syncStatus = "PLAN UPDATED";
            WatchUi.requestUpdate();
        }
    }
}

class IliaConnectionListener extends Communications.ConnectionListener {
    function initialize() {
        ConnectionListener.initialize();
    }

    function onComplete() {
        var app = Application.getApp() as IliaCoachApp;
        app._syncStatus = "REQUEST SENT";
        WatchUi.requestUpdate();
    }

    function onError() {
        var app = Application.getApp() as IliaCoachApp;
        app._syncStatus = "PHONE OFFLINE";
        WatchUi.requestUpdate();
    }
}
