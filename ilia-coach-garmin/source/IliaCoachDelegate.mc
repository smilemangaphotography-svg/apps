using Toybox.WatchUi as WatchUi;

class IliaCoachDelegate extends WatchUi.BehaviorDelegate {
    var _view;

    function initialize(view) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    function onSelect() {
        return _view.handleSelect();
    }

    function onNextPage() {
        return _view.handleNext();
    }

    function onPreviousPage() {
        return _view.handlePrevious();
    }

    function onMenu() {
        return _view.handleMenu();
    }

    function onBack() {
        return _view.handleBack();
    }
}
