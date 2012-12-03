    var $friendsOnline,
        $friendsOffline,
        $friendsPending,
        TIME_BEFORE_IDLE = 1000 * 60,
        user_name = "tester";

module("populateFriendsList()", {
    setup: function() {
        initFriendsListDivs();
    },
    teardown: function() {
        removeFriendsListDivs();
    }
});
test("Should handle null friends array", function () {    
    var list = null;
    populateFriendsList(list, TIME_BEFORE_IDLE);
    ok($friendsOnline.children().length == 0, "Handles null friends array.");
});
test("Should handle undefined friends array", function() {
    populateFriendsList();
    ok($friendsOnline.children().length == 0, "Handles undefined friends array.");
});
test("Should handle empty friends array", function() {
    var list = getList(-1);
    populateFriendsList(list);
    ok($friendsOnline.children().length == 0, "Handles empty friends array.");
});
test("Should handle shuffled filled array in alphabetical order", function() {
    expect(2);
    
    var list = getList(5, 5, 4, 4);
    populateFriendsList(list, TIME_BEFORE_IDLE);
    ok($friendsOnline.children().length ==  5 + 5 
        && $friendsOffline.children().length == 4 
        && $friendsPending.children().length == 4, 
        "Handles filled friends array.");
    
    //Check that it adds online items in alphabetical order
    var isSorted = true,
        nChildren = $friendsOnline.children().length,
        $curr = $friendsOnline.children().first(),
        $prev = null;
    for(var i = 0; i < $friendsOnline.children() && isSorted; i++) {
        if($prev != null && $prev.attr("id").substring(2).toLowerCase()
            .localeCompare($curr.attr("id").substring(2).toLowerCase()) >= 0)
            isSorted = false;
        $prev = $curr;
        $curr = $curr.next();
    }
    
    //Check that it adds offline items in alphabetical order
    nChildren = $friendsOffline.children().length;
    $curr = $friendsOffline.children().first();
    $prev = null;
    for(var i = 0; i < $friendsOffline.children() && isSorted; i++) {
        if($prev != null && $prev.attr("id").substring(2).toLowerCase()
            .localeCompare($curr.attr("id").substring(2).toLowerCase()) >= 0)
            isSorted = false;
    }
    //Check that it adds pending items in alphabetical order
    nChildren = $friendsPending.children().length;
    $curr = $friendsPending.children().first();
    $prev = null;
    for(var i = 0; i < $friendsPending.children() && isSorted; i++) {
        if($prev != null && $prev.attr("id").substring(2).toLowerCase()
            .localeCompare($curr.attr("id").substring(2).toLowerCase()) >= 0)
            isSorted = false;
    }
    ok(isSorted, "Adds items in alphabetical order.")
});



module("getNewFriendEntry()");
test("Should create correct friend list objects", function() {
    expect(4);
    var $user = getNewFriendEntry({
        _id: 1,
        username: "Active",
        lastActivity: new Date()
    }, TIME_BEFORE_IDLE);    
    ok($user.attr("id").substring(2) === "Active" && $user.hasClass("active"), "Created active object.");  
    $user = getNewFriendEntry({
        _id: 1,
        username: "Idle",
        lastActivity: new Date(1)
    }, TIME_BEFORE_IDLE);    
    ok($user.attr("id").substring(2) === "Idle" && $user.hasClass("idle"), "Created idle object.");
    $user = getNewFriendEntry({
        _id: 1,
        username: "Offline",
    }, TIME_BEFORE_IDLE);    
    ok($user.attr("id").substring(2) === "Offline" && $user.hasClass("offline"), "Created offline object.");
    $user = getNewFriendEntry({
        username: "Pending"
    }, TIME_BEFORE_IDLE);    
    ok($user.attr("id").substring(2) === "Pending" && $user.hasClass("offline"), "Created pending object.");
});

module("getNewListEntry()");
test("Should create correct friend list objects", function() {
    var $user = getNewListEntry({
        username: "Blocked"
        }, "unblock, befriend");    
    ok($user.attr("id").substring(2) === "Blocked" && $user.hasClass("active"), "Created blocked object.")
});

module("insertUser()", {
    setup: function() {
        initFriendsListDivs();
    },
    teardown: function() {
        removeFriendsListDivs();
    }
});
test("Should insert objects into correct position", function() {
    expect(5);
    insertUser($("<div id='f_broccoli'>broccoli</div>"), "friends-online");
    ok($friendsOnline.children("div:nth-child(1)").attr("id") 
        === "f_broccoli", "Inserted into empty list");
        
    insertUser($("<div id='f_asparagus'>asparagus</div>"), "friends-online");
    ok($friendsOnline.children("div:nth-child(1)").attr("id") 
        === "f_asparagus", "Inserted before first element");
        
    insertUser($("<div id='f_potato'>potato</div>"), "friends-online");
    ok($friendsOnline.children("div:nth-child(3)").attr("id") 
        === "f_potato", "Inserted after last element");
        
    var $temp = $("<div id='f_cucumber'>cucumber</div>");
    insertUser($temp, "friends-online");
    ok($friendsOnline.children("div:nth-child(3)").attr("id") 
        === "f_cucumber", "Inserted in between two elements");
        
    //Intentional duplicate
    insertUser($temp, "friends-online");
    ok($friendsOnline.children("div:nth-child(3)").attr("id") 
        === "f_cucumber" && $friendsOnline.children().length == 4
        , "Reinserted an element already present");
});
//test("Should", function() {

//});



/***********************************************************************
Helper Functions
***********************************************************************/
function getList(active, idle, offline, pending) {
    var a,
        i;
    if(active || idle || offline || pending){
        a = [];
        if(active)
            for(i = 0; i < active; i++)
                a.push({_id: 1, username: "Online" + i, lastActivity: new Date()});
        if(idle)
            for(i = 0; i < idle; i++)
                a.push({_id: 1, username: "Idle" + i, lastActivity: new Date(1351989000000)});
        if(offline)
            for(i = 0; i < offline; i++)
                a.push({_id: 1, username: "Offline" + i, lastActivity: null});
        if(pending)
            for(i = 0; i < pending; i++)
                a.push({_id: null, username: "Pending" + i, lastActivity: null});
        a = shuffle(a);
    }
    
    return a;
}
function initFriendsListDivs() {
    //removeFriendsListDivs();
    //$("#qunit-fixture").append("<div>").attr("id","teststuff");
    $friendsOnline = $("<div>").appendTo("#qunit-fixture");
    $friendsOffline = $("<div>").appendTo("#qunit-fixture");
    $friendsPending = $("<div>").appendTo("#qunit-fixture");
    $friendsOnline.attr("id","friends-online").css("display", "none");
    $friendsOffline.attr("id","friends-offline").css("display", "none");
    $friendsPending.attr("id","friends-pending").css("display", "none");
}
function removeFriendsListDivs() {
    if($friendsOnline != null)
        $friendsOnline.remove();
    if($friendsOffline != null)
        $friendsOffline.remove();
    if($friendsPending != null)
        $friendsPending.remove();
}
function shuffle(array) {
    var tmp, current, top = array.length;

    if(top) 
        while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }

    return array;
}