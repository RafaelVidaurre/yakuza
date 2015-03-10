Yakuza
======
Yakuza is a heavy-weight, highly-scalable framework for scraping projects.
Wether you are building small to massive scrapers yakuza will keep your code under control

Installation
------------
`npm install yakuza`

Concepts
========
Yakuza introduces several concepts to help you build your scrapers

Task
----
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
