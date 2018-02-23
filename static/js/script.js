var feature = $('.ui-feature');
$(".ui-preview").click(function () {
    var theID  = $(this).data("id");

    feature.filter(function() {
        return $(this).data('category') === theID
    }).addClass('bg-red');

});
