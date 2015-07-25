(function () {

    var fixtures = {};

    fixtures.events = [
        {
            name: 'Smashing Summer Event',
            description: 'smashing event this Thursday. ',
            content: 'Event content stored here. This is a smashing party ' +
            'come out and try the best sushi in town.'
        },
        {
            name: 'Exciting August Event',
            description: 'It is way to hot to be stuck doing yard work ',
            content: 'Event content stored here. '
        },
        {
            name: 'Super Street Bike Race',
            description: 'The 8th annual superbike race is on coming ',
            content: 'Superbike content stored here. '
        }
    ];

    fixtures.users = [
        {
            username: 'foo',
            pw: 'foo'
        },
        {
            username: 'bar',
            pw: 'bar'
        },
        {
            username: 'super',
            pw: 'super'
        }
    ];

    module.exports = fixtures;
}());
