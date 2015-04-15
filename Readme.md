[![Build Status](https://travis-ci.org/Narzerus/yakuza.svg?branch=development)](https://travis-ci.org/Narzerus/yakuza)

Yakuza
======
Yakuza is a heavy-weight, highly-scalable framework for scraping projects.
Whether you are building small or massive scrapers, yakuza will keep your code clean, ordered and under control.

Installation
------------
`npm install yakuza`

Looking for the docs?
---------------------
[Documentation](http://narzerus.github.io/yakuza)

Scraper structure
=================
Yakuza introduces several concepts to help you build your scraper's structure

Tasks
-----
A task is the smallest unit in any scraper. It determines one specific goal for the scraper to
achieve, such as **logging in** or **retrieving a list of articles**. Some task name examples:
*getArticleList*, *getUserProfile*, *login*, *getLinks*.

Tasks can run one after the other or in parallel. Tasks can even be instanced multiple times for
a single job to be performed. For example, if we want to create a scraper that comments random
stuff in a blog which needs a logged in user to comment, then *login* should always run before a
*createComment* task. Maybe we want to create multiple comments for different blog posts at
the same time. Yakuza allows us to do something like this:

1. Login
2. Get list of blog posts
3. Comment random gibberish in all blog posts found in parallel

The criteria which defines how a task is run and how many times it is instanced has to do with
something called `builders`. We will get into that later in this document.


Agents
------
All tasks belong to an agent and it is the agent itself that determines the order in which tasks run and how they run. An agent usually represents a website, so in the case where we were scraping multiple blogs, the agent names could be *techCrunch* or *hackerNews*.

All agents usually have the same tasks with different implementations per agent. For example, both *techCrunch* and *hackerNews* will have a *getArticleList* task.

Agents have a `plan` which determines which tasks will run in parallel and which will run sequentially. This is defined per agent as in some cases the synchrony required between tasks may vary depending on the website being scraped.


Scrapers
--------
Scrapers hold `agents` together. In most projects you will have one scraper, since a scraper represents all the websites you will scrape and how you will scrape them (via its `agents` and their `tasks`).

Following the previous example, we would create a scraper called *articles* whose purpose is to scrape articles from different blog sites.

Structure summary
-----------------
Summing up, the structure in which Yakuza works is as follows:

- Scraper1
  - Agent1
    - Task1
    - Task2
  - Agent2
    - Task1
    - Task2
- Scraper2
  - Agent3
    - Task3


API
===
Let's get our hands dirty by looking at Yakuza's API

Yakuza
------
To use Yakuza we must first require it in our code:

```javascript
var Yakuza = require('yakuza');
```

It is important to point out that Yakuza is a **singleton** and therefore all `requires` of Yakuza will point to the **same instance**. The idea behind this is to allow the developer to define his file structure freely, whether it is one file for the whole project or multiple files for each task, agent and scraper used.

Scrapers
--------
The first step is to create a scraper, as all other pieces of our structure should be associated to one.

```javascript
Yakuza.scraper('articles');
```

Agents
------
We can now start creating our agents

```javascript
Yakuza.agent('articles', 'techCrunch');
```

Remember the `plan` property we mentioned before? Now is a good time to use that. The `plan` property is an array of task names. Each task in the array runs after the previous one. If an array is placed inside the `plan` array, all tasks inside it will run in parallel.

This plan runs `login`and `getArticlesList` sequentially:

```javascript
Yakuza.agent('articles', 'techCrunch').plan([
  'login',
  'getArticlesList'
]);
```

This one runs `login` before the other tasks, but runs `getArticlesList` and `getUsersList` in parallel as they are in the same sub-array:

```javascript
Yakuza.agent('articles', 'techCrunch').plan([
  'login',
  ['getArticlesList', 'getUsersList']
]);
```

Agents can also define something called `routines` which in turn define a set of tasks to be run. For example you could want to define three routines:
**onlyArticlesList**, **onlyUsersList**, **usersListAndArticlesList**

They would be defined like this:

```javascript
Yakuza.agent('articles', 'techCrunch').routine('onlyArticlesList', ['login', 'getArticlesList']);
Yakuza.agent('articles', 'techCrunch').routine('onlyUsersList', ['login', 'getUsersList']);
Yakuza.agent('articles', 'techCrunch').routine('usersListAndArticlesList', ['login', 'getUsersList', 'getArticlesList']);
```

Dont worry, routines will make more sense after we understand how to run a scraper


Tasks
-----
Tasks are where you are going to spend most of your time. They hold the scraping logic and basically do all the dirty work.

```javascript
// Creating a task
Yakuza.task('articles', 'techCrunch', 'getArticlesList');
```

Tasks have two important concepts: the `main` method, and the `builder`. First, let's start with the builder. As we mentioned previously, the builder is a method which defines how a `task` will be instanced. Tasks come with a default builder which simply instances them once.

The task being built will be instanced depending on what the builder method returns:
- If it returns an array, it will instance the Task as many times as there are elements present inside the array.
- If it returns anything other than an array, it will instance the Task once.
** Note that if an empty array is returned, the task will be skipped **

Also, what is returned by the builder will be provided to the Task instances.

A builder method is defined as follows (mind the name "job" in the method's parameter, as jobs will be explained right after this section):

```javascript
// Job is an accessor to some properties provided by the current job running
Yakuza.task('articles', 'techCrunch', 'getArticlesList').builder(function (job) {
  return [1, 2, 3]; // Instances the task three times, one with each number as parameter
  return []; // Skips the task completely
  return [{a: 1}, {a: 2}]; // Instances the task twice with each object as parameter
  return true; // Instances the task once (this is the default)
});
```

The second and most important concept is the `main` method, which defines the scraping logic itself.
The main method receives the following arguments:

**task** has the following methods:
- `success(data)`: marks the task as successful and emits a success event with the data passed to it
- `fail(error, errorMessage)`: marks the task as failed, stops the current job and emits a fail event with the error object and error message passed
- `share(key, value, [options])`: shares a value to tasks in the next execution block

**params** passes whatever value was returned by the builder to instance this task
For example, if the builder returned `[1, 2, 3]` then three tasks would be instanced with params being the values `1`, `2` and `3` (one for each)

**http** wrapper over [needle](https://github.com/tomas/needle) which is used for http requests. Other tools can be used instead of http, though it is recommended since it will log your requests, improve emitted errors and provide you with some utilities that might be useful.
It has the following utility methods:
`getLog()`: provides a log of the current requests made by the task instance
`get`, `post`, `put`, `patch`, `head`: generate http requests with the corresponding http verb, arguments are
pattern matched and can be:
- an options object: It can have the same properties as [needle](https://github.com/tomas/needle) but also accepts:
  - url: 'url to which the request should be made'
  - data: 'data to be sent to the url (will be stringified in querystring format if passed to `get` and will be used as form data if passed to `post`
- an url string: If an url is provided then no options should be passed.
- callback: Callback method to be called when the request is finished, parameters received are:
  - err: error object, `null` if no error is present
  - res: response object, contains all response and request details provided by [needle](https://github.com/tomas/needle)
  - body: body of the response as supported by [needle](https://github.com/tomas/needle)
The `http` object's request methods return a promise implemented with [Q](https://github.com/kriskowal/q)
Each task **must** at some point call either `task.success` or `task.fail` for the scraper to work correctly. If both are called by the same task instance, an error will be raised

Some examples:
```javascript
var cheerio = require('cheerio');

Yakuza.task('articles', 'techCrunch', 'getArticlesList').main(function (task, http, params) {
  http.get('www.foo.com', function (err, res, body) {
    var $, articleLinks;

    if (err) {
      task.fail(err, 'Request returned an error');
      return; // we return so that the task stops running
    }

    $ = cheerio.load(body);

    articleLinks = [];

    $('a.article').each(function ($article) {
      articleLinks.push($article.attr('href'));
    });

    task.success(articleLinks); // Successfully return all article links found
  });
});
```

Using parameters
```javascript
Yakuza.task('foo', 'loginExampleCom', 'login').main(function (task, http, params) {
  var username, password, opts;

  username = params.username;
  password = params.password;
  opts = {
    url: 'http://www.loginexample.com',
    data: {
      username: username,
      pass: password
    }
  };

  http.post(opts, function (err, res, body) {
    if (err) {
      task.fail(err, 'Error in request');
      return;
    }

    if (body === 'logged in') {
      task.success('loggedIn');
      return;
    }

    task.success('wrongPassword'); // Still not an error though, we correctly detected that the password was wrong
  });
});
```

Jobs
----
Jobs are not part of the scraper structure itself but rather a product of it. Jobs are a one-time use you are giving to your scraper, so each time you want to scrape, you create a job. Jobs can receive parameters which can later be passed all the way down to the tasks, thus customizing the task's behavior (explained in the extras section).

Creating a job:
```javascript
  // At this point our scrapers/agents/tasks are completely defined

  // Here we create a job that will use the agent 'techCrunch' from our 'articles' scraper
  var job = Yakuza.job('articles', 'techCrunch');

  // .. At this point the job still doesn't know what to do. We can do either
  // this:
  job.enqueue('login').enqueue('getArticlesList');
  // or this
  job.enqueueTaskArray(['login', 'getArticlesList']);
  // or if we had defined a routine we could do
  job.routine('onlyArticlesList');
```

At this point the job is almost ready to run, just one thing is missing: `events`. We need some way to listen to what's happening inside our job so we can make use of the data retrieved and be able to react to errors.

To listen to events you must use the `job.on` method.

List of events:

`job:success`: When the job finished successfully
arguments:
- `response`: For now this is undefined, this may in the future return statistics of the job or other useful data

`job:finish`: When the job finished, whether by fail or success
- `response`: Same as `job:success`

`job:fail`: When the job failed
arguments:
- `response.task`: Instance of the task that failed
- `response.error`: Error returned via `task.fail()`, (to get the error stack trace, use `response.error.stack`)
- `response.requestLog`: Array of all requests and responses that led to the failure

`task:<taskName>:success`: When a task finishes successfuly
- `response.task`: Instance of the task that succeeded
- `response.data`: Data provided via the `task.success()` method

`task:<taskName>:fail`: When a task finishes on fail
- `response.task`: Instance of the task that failed
- `response.error`: Error returned via `task.fail()`, (to get the error stack trace, use `response.error.stack`)
- `response.requestLog`: Array of all requests and responses that led to the failure

Events support wildcards, meaning you can do things like: `task:*:fail` to listen to any task which fails or `job:*` to listen to all events concerning the job itself.

An example:
```javascript
  var job = Yakuza.job('someScraper', 'someAgent');

  job.on('job:fail', function (response) {
    // Handle job failure
  });

  job.on('task:*:fail', function (response) {
    console.log(response.task.taskId + ' failed!');
  });

  job.on('task:*:success', function (response) {
    // Handle all successful tasks
  });

  job.on('task:login:fail', function (response) {
    console.log('Failed to log in');
  });

  // Enqueue tasks and run job
```

Running a Job:
To run the job simply use the job.run() method, please keep in mind jobs are not reusable.

```javascript
  job.run(); // Job will start running
```

Hooks
=====
Hooks are run in specific moments of an instanced `task`'s life (before emitting events to the outside), and they can modify the scrapers default behavior. 
To specify a `task`'s hooks use its `setup` method.

```javascript
Yakuza.task('scraper', 'agent', 'someTask').hooks({
  'onFail': function (task) {
    // ... do stuff
  },
  'onSuccess': function (task) {
    // ... do stuff
  }
});
```

onFail
------
Runs when a task fails, `onFail` can be used to do some fancy stuff like retrying failed tasks right away.

The `task` object passed to the `onFail` hook has the following properties:
- runs: Amount of times the task has run (starts from 1)
- params: Parameters with which the task was instanced for the first time (doesn't change)
- rerun([params]): Re-runs the task with original parameters (passed by the builder), if an object is provided, it will replace the task's parameters with the object passed.
- error: Error thrown by the task's `fail` event, (if passed)

onSuccess
---------
Runs when a task succeeds, `onSuccess` can be used to stop the job's execution even though the task was successful. This can be useful when we need to stop our execution depending on the data we receive.

The `task` object passed to the `onSuccess` hook has the following properties:
- data: Data returned by the `task`'s success() method
- stopJob(): Method which, if called, stops the job execution in once the current `executionBlock` is done

Here's an example on when this could be useful:

```javascript
  Yakuza.task('scraper', 'agent', 'login').hooks({
    'onSuccess': function (task) {
      // We stop the job if the loginStatus returns `wrongPassword`
      // remember: in many cases wrongPassword might NOT be an error, identifying what's the login status
      // can be part of a successful scraping process as well.
    
      if (task.data.loginStatus === 'wrongPassword') {
        task.stopJob();
      }
    }
  }).main(function (task, http, params) {
    var opts;
    
    opts = {
      url: 'http://someurl.com',
      data: {
        username: 'foo',
        password: 'bar'
      }
    };
    
    http.post(opts)
    .then(function (result) {
      if (result.body === 'wrong password') {
        task.success({loginStatus: 'wrongPassword});
      } else {
        task.success({loginStatus: 'authorized});
      }
    })
    .fail(function (error) {
      task.fail(error);
    })
    .done();
  });
```

When calling `task.stopJob()` the `task:<taskName>:success` event is, of course, still fired.

Advanced
========
If you reached this section, then you should already be able to use Yakuza's basic features and create a working scraper.
The following are other important features Yakuza provides which will help you with more complex stuff in your scrapers.

Job parameters
--------------
Job parameters are specific information you want to pass to certain tasks in your code to customize their behaviour or allow them to work in a more generic fashion.

Passing parameters to a job:
```javascript
  var job = Yakuza.job('someScraper', 'someAgent', {search: 'peanuts'});
```

Job parameters can now be passed to tasks via the builder method in the following way:
```javascript
Yakuza.task('someScraper', 'someAgent', 'searchTheNews')
  .builder(function (job) {
    return job.params.search; // Instances the task ONCE with params = 'peanuts'
  })
  .main(function (task, http, params) {
    var opts = {
      url: 'http://www.some-search-site.com',
      data: {
        search: params
      }
    };

    // The following request will be: GET http://www.some-search-site.com?search=peanuts
    http.get(opts, function (err, res, body) {
      // Do stuff ..
      task.success(result);
    });
  });
```

Sharing between tasks
---------------------
Very frequently you need a certain task to access something from a previous task.
Exposing values from a task:
```javascript
Yakuza.task('articlesScraper', 'fooBlog', 'getArticleUrls', function (task, http, params) {
  // ... Get list of articles from fooBlog here
  task.share('articleUrlList', articleUrls); // Exposes retrieved list of article urls to the other tasks
  // ... Do other stuff
});
```
At this point, all tasks from the next **execution blocks** will have access to the values shared. Tasks from the same **execution block** will not be able to access the variables since they run in parallel and it is uncertain if the value has been shared or not. So, if you need a value shared by a certain task, put that task in an earlier **execution block**.

You can access shared variables in your tasks' builders like this:
```javascript
Yakuza.task('articlesScraper', 'fooBlog', 'getArticleData')
  .builder(function (job) {
    var urls = job.shared('getArticleUrls.articleUrlList'); // <task that shared the value>.<key of the value>

    return urls; // Will instance the `getArticleData` task once for each url retrieved
  })
  .main(function (task, http, params) { // Here params = some article url
    // ... Scrape article urls to get article data
    task.success(data); // emit data to the outside
  });
```

in the previous example we are instancing the `getArticleData` task once per url we got, and all of these are run in parallel. The only problem with this is that we will recieve one `task:getArticleData:success` event per instance, meaning we would have to join all the results in an array as we would get them separately.

This might not be ideal depending on our use case, so we should create another task returns all our results from our `getArticleData` instances in one array

First, we have a little problem... What happens when we share a value on a key which is already used by another instance of the same task? Well, by default the value gets overwritten.
Say a task shares some value to the key `foo`, and there are two instances, then we wouldn't know which is the final value because it depends on which task finished last:
```javascript
  // instance1: value equals 1
  // instance2: value equals 2
  task.share('foo', value);
```

To fix this we need to change the way in which values are being shared. This can be done by adding an `options` object to the `share()` method.

Current properties accepted in the `share` method:

**method**: Can be a string or a function. If a string then Yakuza will search for the sharing methods it knows about, if a function is given Yakuza will use it as the sharing method.
pre-built sharing methods *(More pre-built methods pending)*:
  - `replace` (default): Replaces previous value with new value

To define reusable custom sharing methods, you can use the scraper's `addShareMethod` which receives:
- `methodName`: Name of your sharing method (the one you use in the `method` property in your `options` object)
- `shareFunction`: A function that returns the new value of the shared value. Arguments for it are:
  - `currentValue`: Current value saved, (undefined if nothing has been shared yet)
  - `newValue`: New value to be shared

An example of a custom sharing method which would allow us to join all urls in an array:
```javascript
Yakuza.scraper('articlesScraper')
  .addShareMethod('joinInArray', function (currentValue, newValue) {
    var current = currentValue;
    if (current === undefined) {
      current = [];
    }

    current.push(newValue);
    return current; // Shared value will always be an array
  });
```

Now we should share our results with our new sharing logic
```javascript
Yakuza.task('articlesScraper', 'fooBlog', 'getArticleData').main(function (task, http, params) {
  // Do stuff and get article data
  task.share('allArticles', articleData, {method: 'joinInArray'});
  // ...
});
```
Perfect, our articles are now all in one single shared value. We should now retrieve it with a tiny final task. Let's call it `getJoinedArticles`

```javascript
Yakuza.task('articlesScraper', 'fooBlog', 'getArticleData')
  .builder(function (job) {
    return job.shared('getArticleData.allArticles'); // Retrieve array of articles
  })
  .main(function (task, http, params) {
    task.success(params); // Simply expose the data to the outside
  });
```

Running task instances sequentially
----------------------------------
Sometimes because of server limitations, we might want several instances of the same task to run sequentially. Take our previous example about articles, where we instanced `getArticleData` multiple times. Let's say the server doesn't allow us to view multiple articles in parallel because god knows why. We would need to change the default behavior of task instances and run them one after the other.

This can be achieved in the agent plan by changing the `selfSync` property:

```javascript
Yakuza.agent('articles', 'fooBlog').plan([
  'getArticlesList',
  {taskId: 'getArticleData', selfSync: true}
]);
```

Saving cookies
--------------
A lot of times we need to preserve cookies so that they exist for other tasks. This can be achieved by a method called `saveCookies()`.

Example:
Yakuza.task('scraper', 'agent', 'login').main(function (task, http, params) {
```javascript
  // .. Send a login form
  task.saveCookies();
  // .. Do more stuff
  task.success('authorized');
});
```

Any new task will now have its `http` object initialized with the cookies that were present at the time `saveCookies` was called. Notice that only tasks from the next **execution block** will be afected.

Retrying tasks
--------------
In many cases the websites we scrape are sloppy, implemented in very wrong ways or simply unstable. This will cause our tasks to sometimes fail without warning. For this reason `Yakuza` provides a way of re-running tasks when this happens via it's `onFail` hook.

When a task is rerun, it restarts to the point in which it was instanced. Except (for some properties like `startTime` which marks the moment when the task was first run)

```javascript
Yakuza.task('scraper', 'agent', 'login').hooks({
  onFail: function (task) {
    if (task.runs <== 5) {
      // Will retry the task a maximum amount of 5 times
      task.rerun();
    }
  }
});
```

You can find the `task` object's properties on the **Hooks section**

Glossary
========

Execution Block
---------------
An execution block is a set of tasks that run in parallel. For example, take the following plan:
```javascript
Yakuza.agent('scraper', 'agent').plan([
  'task1', // Execution block 1
  ['task2', 'task3'], // Execution block 2
  'task4' // Execution block 3
])
```

Execution blocks run sequentially, meaning one execution block will only run when the previous block was run or **skipped**.
\* Tasks are skipped if not `enqueued` or if their builders return empty arrays. Execution blocks are skipped if all tasks inside it are skipped as well.


Contribution
============
At this time, Yakuza is in its early days. For this reason all contributions and issues are more than welcome, they are needed. Yakuza is a very ambitious project that requires a lot of real-life usage to understand how it can be improved.

Because of the size of this project, maintainability is an important concern. For that reason these guidelines **must** be followed for a pull request to be merged:

Branch structure
----------------
Each pull request will come in its own branch and with a specific naming convention.

Existing branches:
`master`: Only for production-ready releases, commits in this code **are** part of a release
`development`: This is the branch you will target your pull requests to. It contains the latest changes that will probably be part of a new release but are not yet available to the public.

Branch naming convention:
`hotfix/<branch name>`: For hotfix pull-requests, basically any quick fixes
`style/<branch name>`: For fixes in code styling, (make linters pass)
`feature/<branch name>`: For feature pull-requests, these are bigger and should **only** contain changes regarding the feature implemented
`bug/<branch name>`: For bug fixes
`refactor/<branch name>`: For repo improvements and refactoring in general

Requisites for a PR to be accepted
----------------------------------
- If it is a feature, it should follow what we think will help Yakuza go forward, this means truly useful features that will help more people, and not something that only helps your use case.
** We recommend creating a discussion about your idea before actually coding**
- All tests must pass. Add tests to whatever you add to the framework (See testing guidelines below).
- Merge conflicts should be fixed on your end.
- Please note that your PR may be on discussion for a while, but don't worry: if it is heading the right way it will make it to the master branch.

JSDocs
------
JSDocs should be added for any new methods/classes you add to Yakuza.

Testing
-------
To test Yakuza run the following command:
`npm test` and make use all tests pass.

We use [Mocha](http://mochajs.org/) as our test runner and [Chai](http://chaijs.com/) as our assertion library.

We use ESLint as our linter.

Known Issues
------------
- Cookies with some special characters (like `:`) are not correctly parsed. This has to do with a bug in the [needle](https://github.com/tomas/needle) package and a PR with the fix is currently waiting to be merged
