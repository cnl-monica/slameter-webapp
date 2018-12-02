Installation Instruction
========================

This guide will walk you through installation process of API webserver of SLAmeter.

Guide is specific to Ubuntu 12.04 LTS, 64bit version.
If you are deploying on other OS, required steps may differ.

Prerequisities
--------------

* PC with 64bit version of Ubuntu 12.04 LTS OS
* Updated OS
* Installed Python v2.7.x (available by default on Ubuntu 12.04)
* Internet connection

Basic installation steps
------------------------

#. Install required software packages:

    .. code-block:: bash

        sudo apt-get install python-pip postgresql-9.1 subversion git libpq-dev python-dev



#. Setup access to Postgresql:

    .. code-block:: bash

        $ sudo -u postgres psql postgres

    In Postgres shell enter the following command and type your selected password when prompted:

    .. code-block:: sql

        \password postgres

    Exit from postgresql shell:

    .. code-block:: sql

        \q


#. Create user and database for API webserver:

    Create new postgres user role. When prompted for password for new user, enter **slaweb**:

    .. code-block:: bash

        sudo -u postgres createuser -D -A -P slawebuser

    Create new database with created user as a owner:

    .. code-block:: bash

        sudo -u postgres createdb slaweb -O slawebuser


    .. warning::

        Here proposed username **slawebuser** and password **slaweb** are default
        password set in database configuration of the project.

        If you are installing this project not only for local development,
        **you should choose your own username and password** for database access.


#. Install node.js:

    .. code-block:: bash

        sudo add-apt-repository ppa:chris-lea/node.js
        sudo apt-get update
        sudo apt-get install nodejs


#. Install node packages:

    .. code-block:: bash

        sudo npm install grunt-cli -g
        sudo npm install bower -g


#. Install ruby and ruby package manager:

    .. code-block:: bash

        sudo apt-get install ruby rubygems


#. Install ruby packages:

    .. code-block:: bash

        sudo gem install sass compass


#. Download SLAmter webserver project:

    .. code-block:: bash

        mkdir slameter_web
        cd slameter_web
        svn checkout https://svn.cnl.sk/monica/SLAmeter/web/trunk/ .

    Tere are two projects in downloaded repository: ``slaweb_api`` and ``slaweb_app``.
    API webserver, which we are installing, is in ``slaweb_api`` directory.


#. Go to webserver directory:

    .. code-block:: bash

        cd slaweb_api


#. Install server project requirements:

    .. code-block:: bash

        sudo pip install -r requirements.txt


#. Go to webclient directory:

    .. code-block:: bash

        cd ../slaweb_app


#. Install client project requirements

    .. code-block:: bash

        npm install
        bower install





