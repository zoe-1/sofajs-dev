
(function () {


    var fixtures = {};

    fixtures.functions = {};
    fixtures.users = {};

    fixtures.events = [
        {
         type: 'event',
         title: 'New Event Title 1',
         snippet: 'Snippet Content Describing Event',
         primo: false,
         date: new Date(Date.now()),
         timezone: { country: 'CHINA', zone: 'CST' },
         dateOccurring: {
             startDate: new Date(2015, 9, 1, 18, 15, 0),
             startDatePretty: 'September 1st, 2015',
             endDate: new Date(2015, 9, 6, 12, 0, 0),
             endDatePretty: 'September 6th, 2015'
         },
         images: { bannerImage: 'event_fast.jpg', cardImage: 'event_fast.jpg' },
         content: 'Event Content1'
        },
        {
         type: 'event',
         title: 'New Event Title 2',
         snippet: 'Snippet Content Describing Event',
         primo: false,
         date: new Date(Date.now()),
         timezone: { country: 'CHINA', zone: 'CST' },
         dateOccurring: {
             startDate: new Date(2015, 9, 7, 18, 15, 0),
             startDatePretty: 'September 7th, 2015',
             endDate: new Date(2015, 9, 6, 12, 0, 0),
             endDatePretty: 'September 6th, 2015'
         },
         images: { bannerImage: 'event_fast.jpg', cardImage: 'event_fast.jpg' },
         content: 'Event Content2'
        },
        {
         type: 'event',
         title: 'New Event Title 3',
         snippet: 'Snippet Content Describing Event',
         primo: false,
         date: new Date(Date.now()),
         timezone: { country: 'USA', zone: 'EST' },
         dateOccurring: {
             startDate: new Date(2015, 9, 30, 18, 15, 0),
             startDatePretty: 'September 30th, 2015',
             endDate: new Date(2015, 10, 5, 12, 0, 0),
             endDatePretty: 'October 5th, 2015'
         },
         images: { bannerImage: 'event_fast.jpg', cardImage: 'event_fast.jpg' },
         content: 'Event Content3'
        },
        {
         type: 'event',
         title: 'New Event Title 4',
         snippet: 'Snippet Content Describing Event',
         primo: false,
         date: new Date(Date.now()),
         timezone: { country: 'CHINA', zone: 'CST' },
         dateOccurring: {
             startDate: new Date(2015, 9, 10, 18, 15, 0),
             startDatePretty: 'September 10th, 2015',
             endDate: false, // One day event.  Ends same day.
             endDatePretty: 'ends same day'
         },
         images: { bannerImage: 'event_fast.jpg', cardImage: 'event_fast.jpg' },
         content: 'Event Content4'
        }
    ];

    fixtures.users = [
        {
            username: 'Foo Foo',
            first: 'Foo',
            last: 'Foo',
            pw: 'foo',
            email: 'foo@hapiu.com',
            scope: ['admin', 'user'],
            loginAttempts: 0,
            lockUntil: Date.now() - 60 * 1000
        },
        {
            'username': 'Bar Head',
            'first': 'Bar',
            'last': 'Head',
            'pw': 'bar',
            'email': 'bar@hapiuni.com',
            'scope': ['user'],
            loginAttempts: 0,
            lockUntil: Date.now() - 60 * 1000
        },
        {
            username: 'user1',
            pw: '8899l1v3',
            email: 'js@dali.photo',
            first: 'Jon',
            last: 'Swenson',
            scope: ['admin', 'user'],
            loginAttempts: 0,
            lockUntil: Date.now() - 60 * 1000
        }
    ];

    // list view fixture

    fixtures.users.list = function (doc) {

        if (doc.username && doc.first && doc.last && doc.email) {
            // key is id an revision id.
            emit([doc._id, doc._rev], { username: doc.username, first: doc.first, last: doc.last, email: doc.email, pw: doc.pw, scope: doc.scope, loginAttempts: doc.loginAttempts, lockUntil: doc.lockUntil });
        }
    };

    // Array of _design/xxxxxx views
    // SAMPLE view document
    //{
    //   "_id": "_design/users",
    //   "_rev": "1-8e794d7de0a81f2086735d619a816b80",
    //   "language": "javascript",
    //   "views": {
    //      "list": {
    //          "map": "function (doc) {\n
    //              if(doc.type == 'user') {    \n
    //                  emit(doc._id , { email: doc.email, first: doc.first, last: doc.last, username: doc.username, scope: doc.scope }); \n        }\n    }"
    //              }
    //  }
    //}
    // Below: fixture view function.
    fixtures.views = [{
            language: 'javascript',
            views: { list: {
                    map: fixtures.users.list
                }
            }
    }];


    module.exports = fixtures;
}());
