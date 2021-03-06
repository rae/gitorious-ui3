/*global gts, cull, dome, reqwest, Spinner*/
// The global, shared Gitorious namespace
this.gts = this.gts || {};

/**
 * gts.treeHistory(tableElement, treeHistoryUrl)
 *
 * Loads the tree history JSON payload from Gitorious and annotates an
 * HTML table containing a Git tree with commit data. The HTML table
 * is expected to look like:
 *
 * <table>
 *   <!-- Possible thead and tfoot, ignored -->
 *   <tbody>
 *     <tr>
 *       <td class="gts-name">
 *         <a href="/gitorious/gitorious/source/master:bin">
 *           <i class="icon icon-folder-close"></i>
 *           bin
 *         </a>
 *       </td>
 *       <td class="gts-commit-date"></td>
 *       <td class="gts-commit-oid"></td>
 *       <td></td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * treeHistory will fill out the commit date, oid and add the last commit
 * message to the last cell.
 *
 * treeHistory also supports initial empty <td> elements, as created by Dolt
 * when directory hierarhy indentation is enabled.
 *
 * The treeHistoryUrl points to the tree history JSON resource, which
 * looks like
 *
 *   [{ "name": "bin",
 *      "oid": "08e37640144b900e8e876f621332b64c39c79567",
 *      "filemode": 16384,
 *      "type": "tree",
 *      "history": [{
 *        "oid": "762d5a7186850dca6b507402ca7bbec2df2dea72",
 *        "author": {
 *          "name": "Marius Mathiesen",
 *          "email": "marius@gitorious.org"
 *        },
 *        "date": "2012-10-04T14:15:33+02:00",
 *        "summary": "Set ENV[\"HOME\"] to make resque work with SSH keys",
 *        "message": ""
 *      }, { ... }]
 *    }, { ... }]
 */
this.gts.treeHistory = (function (c, d) {
    var cachedJSON = gts.cache(gts.jsonRequest);

    function el(element, tagName) {
        return element.getElementsByTagName(tagName);
    }

    var th = function (table, url) {
        var cell = el(el(table, "tbody")[0], "td")[2];
        var spinner = new Spinner({
            lines: 13,
            length: 1,
            width: 2,
            radius: 6,
            corners: 1,
            rotate: 0,
            color: "#000",
            speed: 1,
            trail: 60,
            shadow: false,
            hwaccel: true,
            className: "spinner",
            zIndex: 2e9,
            top: "auto",
            left: "auto"
        }).spin(cell);

        cachedJSON(url).then(function (tree) {
            spinner.stop();
            th.annotate(table, tree);
        });
    };

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function getFileMeta(fileName, tree) {
        return c.select(function (e) {
            return e.name === fileName;
        }, tree)[0];
    }

    function formatDate(dateStr) {
        if (!Date.parse) { return ""; }
        var d = new Date(Date.parse(dateStr));
        return months[d.getMonth()] + " " + d.getDate() + " " + d.getFullYear();
    }

    function getTreeIndent(cells) {
        var i, l;
        for (i = 0, l = cells.length; i < l; ++i) {
            if (dome.cn.has("gts-name", cells[i])) {
                return i;
            }
        }

        return i;
    }

    function fileName(element) {
        return ((element && dome.text(element)) || "").trim();
    }

    th.annotateRow = function (tree, row) {
        var tds = el(row, "td");
        var offset = getTreeIndent(tds);
        var entry = getFileMeta(fileName(tds[offset]), tree);
        if (!entry) { return; }
        var commit = entry.history[0];
        tds[offset + 1].innerHTML = formatDate(commit.date);
        dome.data.set({ "gts-commit-oid": commit.oid }, tds[offset + 2]);
        tds[offset + 2].innerHTML = "#" + commit.oid.slice(0, 7);
        var summary = commit.summary.trim();
        tds[offset + 3].innerHTML = gts.abbrev(summary, 50, " [...]") +
            " (" + commit.author.name + ")";
    };

    th.annotate = function (table, tree) {
        c.doall(c.partial(function (tree, row) {
            th.annotateRow(tree, row);
        }, tree), el(el(table, "tbody")[0], "tr"));
    };

    return th;
}(cull));
