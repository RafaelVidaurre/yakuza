Yakuza.scraper('banks').setup(function (config) {
  config.agentsVariables = {
    forex: 450,
    foo: 'bar'
  };

  // Only necessary if planning to schedule by tags instead of listing all task_ids
  config.taskTags = {
    'login': ['login'],
    'accounts_list': ['accounts_list'],
    'transactions_current_checking': ['transactions', 'current', 'checking'],
    'transactions_current_vista': ['transactions', 'current', 'vista'],
    'transactions_current_cl': ['transactions', 'current', 'cl'],
    'transactions_current_cc_national': ['transactions', 'current', 'cc', 'national'],
    'transactions_current_cc_international': ['transactions', 'current', 'cc', 'international'],
    'transactions_historic_checking': ['transactions', 'historic', 'checking'],
    'transactions_historic_vista': ['transactions', 'historic', 'vista'],
    'transactions_historic_cl': ['transactions', 'historic', 'cl'],
    'transactions_historic_cc_national': ['transactions', 'historic', 'cc', 'national'],
    'transactions_historic_cc_international': ['transactions', 'historic', 'cc', 'international']
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


// beforeMain hook runs logic before a task like validation, the difference between this and a
// builder (besides the builder deciding task instancing) is that this is run once per every
// task instance, provided with the parameters it requires
Yakuza.task('banks', 'santander', 'login').hooks({
  beforeMain: function (..someParams..) {
    // Do some data validation ...
    // Halt execution chain if data is invalid
  }
});







// == Starting a scraper == //
var job = Yakuza.job('banks', 'santander');
// Though a job could tecnically be instanced from a scraper or even an agent, multiple choices
// here would be rather confusing.

job.params({
  username: '17.142.244-7',
  password: 'asd123'
});


// Only example, not necesarily proper event structure/namespacing/paramers
job.listen({
  'scraper:onFinish': function (response) {
    // send rails onFinish status for specific jobId
  },
  'task:onFinish': function (response) {
    // update rails with specfic task data
  },
  '*:onError': function () {
    // notify erro panel
  }
});

// Only schedulize login, acc_list and current transactions tasks.
// Schedule works with tags
job.enqueueByTags('login');
job.enqueueByTags('accounts_list');
job.enqueueByTags('transactions', 'current');

// Traditional more straightforward aproach would be
job.enqueue('login');
job.enqueue('accounts_list');
job.enqueue('transactions_current_checking');
job.enqueue('transactions_current_cl');
job.enqueue('transactions_current_visa');
job.enqueue('transactions_current_cc_national');
job.enqueue('transactions_current_cc_international');

// TODO: Params validation could be either removed from the framework's responsibility or defined at
// setup time, if so, scraper-level params would run for any agent being run, and agent-level
// validations only for that agent, PLUS scraper-level ones.

// Advantages of responsibilizing for params validation: Since validations can be agent-scoped this
// means that a specific agent mantainer will contemplate validations for his agent as their own
// responsibility.

// Advantages of relieving the framework from validation responisibilities: more lightweight, less
// confusing for people with small projects. Overall simplicity mostly.
var validationsResult = job.start();

if (validationsResult.status === 'error') {
  // do something if data is invalid
}
