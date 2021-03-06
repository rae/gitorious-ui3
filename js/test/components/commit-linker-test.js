/*global buster, assert, refute, jQuery, gts*/
buster.testCase("Commit linker", {
    setUp: function () {
        this.el = document.createElement("div");
        // Required for even triggering to work properly
        document.body.appendChild(this.el);
    },

    "triggers handler for gts-commit-oid link": function () {
        var cb = this.spy();
        this.el.innerHTML = "<span class=\"gts-commit-oid\" " +
            "data-gts-commit-oid=\"master\">master</span>";

        gts.commitLinker(this.el, "/gitorious/mainline/commit/#{oid}", cb);
        jQuery(this.el.firstChild).trigger("click");

        assert.calledOnceWith(cb, "/gitorious/mainline/commit/master");
    },

    "does not trigger handler for regular link": function () {
        var cb = this.spy();
        this.el.innerHTML = "<span>master</span>";

        gts.commitLinker(this.el, "/gitorious/mainline/commit/#{oid}", cb);
        jQuery(this.el.firstChild).trigger("click");

        refute.called(cb);
    },

    "triggers handler for link added later": function () {
        var cb = this.spy();

        gts.commitLinker(this.el, "/gitorious/mainline/commit/#{oid}", cb);
        this.el.innerHTML = "<span class=\"gts-commit-oid\" " +
            "data-gts-commit-oid=\"master\">master</span>";
        jQuery(this.el.firstChild).trigger("click");

        assert.calledOnce(cb);
    },

    "adds class name to root element": function () {
        gts.commitLinker(this.el, "/gitorious/mainline/commit/#{oid}");

        assert.className(this.el, "gts-commit-linker");
    }
});
