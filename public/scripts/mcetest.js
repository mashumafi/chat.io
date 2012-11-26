var user_name = "MCE-Test";

$(document).ready(function () {
            createDialog({room: "One"}, receive);
            createDialog({room: "Two"}, receive);
            createDialog({room: "Three"}, receive);
});