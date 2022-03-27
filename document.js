(function (document) {
    document.showPage = function (page_id) {
        document.querySelectorAll(".content-page").forEach((page) => {
            page.style.display = 'none';
        });
        let element = document.getElementById(page_id);
        element.style.display = 'block';

        let event;
        if (document.createEvent) {
            event = document.createEvent("HTMLEvents");
            event.initEvent("show", true, true);
            event.eventName = "show";
            element.dispatchEvent(event);
        } else {
            event = document.createEventObject();
            event.eventName = "show";
            event.eventType = "show";
            element.fireEvent("on" + event.eventType, event);
        }
    }
})(document);