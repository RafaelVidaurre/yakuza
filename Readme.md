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

Hooks
-----
Hooks are callbacks that are executed at certain points of a Task's life. These are defined at
definition level, can interrupt a Job's execution and modify a Task's returned data.

Job
===
A job is a set of tasks from a specific agent run with a specific set of parameters. Each instance
is run only once and then disposed of.

Event listeners
---------------
Events listeners related to the Job, they cannot modify its execution and are read-only functions
which are the main method of communication between the Job and the app using it.

Execution Plan
==============
Represent an array of arrays of objects which hold a task_id and other configuration variables
where each sub-array contains all tasks that can run in parallel (based on task config)



// TODO: Tidy up
parameters:
  - selfSync: Self syncronous, doesn't run concurrently with itself
