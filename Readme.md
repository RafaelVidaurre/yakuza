Yakuza
======

Scraper
=======
Group of agents which achieve the same goals via different logic

Agent
=====
Usually represents scraping logic for one particular website, inherits (but can override) its
scraper's configuration

Task
====
All agents per scraper should have the same amount of tasks, with the same `task_id`s, but each
task implementation is different per agent

Task Queue
==========
Represent an array of arrays of task_ids where each sub-array contains all tasks that can run
together (based on task config)
