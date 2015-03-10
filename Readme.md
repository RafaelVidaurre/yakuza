Yakuza
======
Yakuza is a heavy-weight, highly-scalable framework for scraping projects.
Wether you are building small to massive scrapers yakuza will keep your code under control

Installation
------------
`npm install yakuza`

Scraper structure
=================
Yakuza introduces several concepts to help you build your scraper's structure

Tasks
-----
A task is the smallest unit in any scraper, it determines one specific goal for the scraper to
achieve, such as **logging in** or **retrieving a list of articles**. Some task names examples:
*getArticleList*, *getUserProfile*, *login*, *getLinks*.

Each task can run after another one, or in parallel, tasks can even be instanced multiple times for
a single job to be performed. For example, if we wanted to create a scraper that comments random
stuff in a blog which needed a logged in user to comment, then *login* should always run before a
*createComment* task. Though maybe we want to create multiple comments for different blog posts at
the same time. Yakuza allows us to do something like this:

1. Login
2. Get list of blog posts
3. Comment random gibberish in all blog posts found in parallel.

The criteria which defines how a task is run and how many times it is instanced has to do with
something called `builders`. But we will get into that later in this document.


Agents
------
All tasks belong to an agent and it is the agent itself which determines the order in which tasks run and also how they run. Agents usually represent a website. So in the case we were scraping multiple blogs, some agent names could be *techCrunch* or *hackerNews*.

All agents usually have the same tasks with different implementations, for example, both *techCrunch* and *hackerNews* will have a *getArticleList* task.

Agents have a `plan` which determines which tasks will run in parallel and which will run sequentially. This is defined per agent as in some cases the syncrony required among tasks may vary depending on the website being scraped.


Scrapers
--------
Scrapers hold `agents` together, in most projects you will have one scraper, as scrapers represent all the websites you will scrape and how you will scrape them (via its `agents` and their `tasks`).

Following the previous example, we would create a scraper called *articles* which purpose is to scrape articles from different blog sites.

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
Now lets get our hands dirty by looking at Yakuza's API

Yakuza
------
To use Yakuza we must first require it in our code:

```javascript
var Yakuza = require('yakuza');
```

It is important to point out that Yakuza is a **singleton** and therefore all `requires` of Yakuza will point to the **same instance**. The idea behind this is to allow the developer to define file structure freely, wether it is one file for the whole project or multiple files for each task, agent and scraper used.

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

Remember the `plan` property we mentioned before? Now is a good time to use that. The `plan` property is an array of task names, each element in the array runs after the previous one. If an array is placed inside the `plan` array, all tasks inside it will run in parallel.

This plan runs `login`and `getArticlesList` sequentially:

```javascript
Yakuza.agent('articles', 'techCrunch').setup(function (config) {
  config.plan = [
    'login',
    'getArticlesList'
  ];
});
```

This one runs `login` before the other tasks, but runs `getArticlesList` and `getUsersList` in parallel as they are in the same sub-array:

```javascript
Yakuza.agent('articles', 'techCrunch').setup(function (config) {
  config.plan = [
    'login',
    ['getArticlesList', 'getUsersList']
  ];
});
```

Agents also can define something called `routines` which define a set of tasks to be run. For example you could want to define three routines:
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

Tasks have two important concepts, the `main` method, and the `builder`. First lets start with the builder, as we mentioned previously, the builder is a method which defines how a `task` will be instanced. Tasks come with a default builder which simply instances them once.

The task being built will be instanced depending on what the builder method returns:
- If it returns an array, it will instance the Task as many times as elements are present inside the array returned.
- If it is not an array, it will instance the Task once.
** Note that if an empty array is returned, the task will be skipped ** 

Also, what is returned by the builder will be provided to the Task instances.

A builder method is defined as follows (mind the name "job" in the method's parameter, as jobs will be explained right after this section):

```javascript
// Job is an accessor to some properties provided by the current job that is running
Yakuza.task('articles', 'techCrunch', 'getArticlesList').builder(function (job) {
  return [1, 2, 3]; // Instances the task three times, one with each number as parameter
  return []; // Skips the task completely
  return [{a: 1}, {a: 2}]; // Instances the task twice with each object as parameter
  return true; // Instances the task once (this is the default)
});
```
