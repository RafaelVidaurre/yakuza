Yakuza.scraper('banks').setup(function (config) {
  config.agentsVariables = {
    forex: 450,
    foo: 'bar'
  };
});


Yakuza.agent('banks', 'santander').setup(function (config) {
// Or Yakuza.scraper('banks').agent('santander').setup ...

  config.globals = {
    country: 'chile' // only overriten for santander agent
  };

  config.executionTiers = [
    'login',
    'accounts_list',
    [
      "transactions_current_checking",
      "transactions_current_vista",
      "transactions_current_cl",
      "transactions_current_cc_national",
      "transactions_current_cc_international",
    ],
    [
      "transactions_historic_checking",
      "transactions_historic_vista",
      "transactions_historic_cl",
      "transactions_historic_cc_national",
      "transactions_historic_cc_international"
    ]
  ];

});

Yakuza.task('banks', 'santander', 'login')
// Or Yakuza.agent('banks', 'santander').task(...)
// Or Yakuza.scraper('banks').agent('santander').task(...)
  .main(function (params, http, finish) {
    // ... Scraping logic

    http.get(...) // random request

    finish.fail('Something went wrong') // some random error

    finish.success(data) // successful scraping
  })
  .hooks({
    // Hooks are accumulative, meaning there can be MANY callbacks pero hook
    beforeSuccess: function (..someParams..) {
      // if status returned is unauthorized break execution chain here
    },
    beforeFail: function (..someParams..) {
      // Attempt retries maybe?
    },
    afterFilters: function (..someParams..) {
      // Could be useful if we need execution control of pre-filtered data
    }
  });


// By default tasks without builders instanciate without extra params only once
// Here's a builder example
Yakuza.task('banks', 'santander', 'transactions_current_checking').builder(function (data) {
// Or Yakuza.builder('banks', 'santander', 'transactions_current_checking', function (data) {
  var checkingAccounts = _.filter(data.accounts, function (account) {
    return account.type === 'checking'
  });

  // Returned an array of accounts, therefore the task will instance once
  // per array element
  return checkingAccounts;
});

// By default tasks are not filtered, therefore tasks only cut execution chan on error which
// has not been handled, and the
Yakuza.task('banks', 'santander', 'transactions_current_checking').filter(function (data) {
  // Do some filtering
  return filteredData; // Will replace previous data with returned one
});


// Instead of using validations we could be using task hooks which run before starting the task's
// main method
Yakuza.task('banks', 'santander', 'login').hooks({
  beforeMain: function (..someParams..) {
    // Do some data validation ...
    // Halt execution chain if data is invalid
  }
});
