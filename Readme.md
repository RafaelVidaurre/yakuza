Yakuza
======

Scraper
=======
Group of agents which achieve the same goals via different logic

Agent
=====
Usually represents scraping logic for one particular website, inherits (but can override) its
scraper's configuration

TaskDefinition
==============
All agents per scraper should have the same amount of taskDefinitions, with the same `task_id`s,
but each taskDefinition is different per agent

Builder
-------
A builder defines the criteria by which a task is instanced. By default tasks have a builder where
the task is only instanced once and with no parameters.

By using `Task.builder()` you can override this default behaviour.

Execution Plan
==============
Represent an array of arrays of objects which hold a task_id and other configuration variables
where each sub-array contains all tasks that can run in parallel (based on task config)

// TODO: Tidy up
parameters:
  - selfSync: Self syncronous, doesn't run concurrently with itself
