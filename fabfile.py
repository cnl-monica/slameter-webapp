from __future__ import unicode_literals
from fabric.api import *
from fabric.utils import error
import ConfigParser

# Read config from fab.conf
_config = ConfigParser.ConfigParser()
_config.read('fab.conf')

if not _config.has_section('Remote server'):
    error("""no "fab.conf" file with "Remote server" section was found in current directory. This file should contain:
[Remote server]
hosts = <list of host addresses to deploy to>
user = <user name>
dir = <base dir where project should be deployed>
""")

env.hosts = _config.get('Remote server', 'hosts')
env.user = _config.get('Remote server', 'user', 0)
env.remote_base_dir = _config.get('Remote server', 'dir', 0)


env.colorize_errors = True

env.django_production_settings = 'slaweb_api.settings.production'

env.server_project_dir = 'slaweb_api'
env.server_prod_dir = 'server'
env.server_static_dir = 'server/static'
env.server_collectstatic_dir = 'tmp_static'

env.client_project_dir = 'slaweb_app'
env.client_prod_dir = 'client'

env.temp_build_dir = '_build'


def local_command_available(command):
    with quiet():
        result = local('command -v {0}'.format(command))
        return result.return_code == 0


def remote_command_available(command):
    with quiet():
        result = run('command -v {0}'.format(command))
        return result.return_code == 0


def local_dir_exists(dir):
    with quiet():
        return local('test -d {}'.format(dir)).succeeded


def local_path_exists(path):
    with quiet():
        return local('test -e {}'.format(path)).succeeded


def remote_dir_exists(dir):
    with quiet():
        return sudo('test -d {}'.format(dir)).succeeded


@task
def prepare_local():
    """
    Prepare project for local development
    """
    if not local_command_available('virtualenv'):
        local('pip install virtualenv')

    if not local_command_available('npm'):
        local('curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.1/install.sh | bash')
        local('nvm install stable')
        local('nvm use stable')

    if not local_command_available('bower'):
        local('npm install -g bower')

    if not local_command_available('ember'):
        local('npm install -g ember-cli@0.2.3')

    if not local_command_available('compass'):
        # TODO
        pass

    with settings(warn_only=True):
        test_env = local('test -e venv/bin/activate')
    if test_env != 0:
        local('virtualenv -p /usr/bin/python2.7 venv')

    with prefix('. venv/bin/activate'):
        local('pip install -r {0}/requirements.txt'.format(env.server_project_dir))

    with lcd(env.client_project_dir):
        local('npm install')
        local('bower install')


@task
def prepare_remote():
    with cd(env.remote_base_dir):
        if not remote_command_available('virtualenv'):
            sudo('pip install virtualenv')

        with settings(warn_only=True):
            test_env = run('test -e venv/bin/activate')
        if test_env != 0:
            sudo('virtualenv -p /usr/bin/python2.7 venv')

        with prefix('. venv/bin/activate'):
            run('pip install -r {0}/requirements.txt'.format(env.server_prod_dir))


@task
def ensure_build_dir_exists():
    if not local_dir_exists(env.temp_build_dir):
        local('mkdir -p {}'.format(env.temp_build_dir))


@task
def build_server():
    """
    Builds a production version of the web server
    """
    ensure_build_dir_exists()
    if not local_dir_exists('{}/{}'.format(env.temp_build_dir, env.server_prod_dir)):
        local('mkdir -p {}/{}'.format(env.temp_build_dir, env.server_prod_dir))

    clean_temp_static = lambda: local('rm -rf {}/{}'.format(env.server_project_dir, env.server_collectstatic_dir))

    clean_temp_static()

    # copy server files
    local('tar -C {}/ -cf - --exclude="*.pyc" . | tar -C {}/{} -xvf -'.format(
        env.server_project_dir, env.temp_build_dir, env.server_prod_dir))

    # prepare static files
    with lcd(env.server_project_dir):
        local('python manage.py collectstatic --settings={} --noinput'.format(env.django_production_settings))

    # copy static files
    local('mv {}/{} {}/{}'.format(env.server_project_dir, env.server_collectstatic_dir,
                                  env.temp_build_dir, env.server_static_dir))

    clean_temp_static()


@task
def build_client():
    """
    Builds a production version of the web client
    """
    ensure_build_dir_exists()
    with lcd(env.client_project_dir):
        local('ember build -prod -o ../{}/{}'.format(env.temp_build_dir, env.client_prod_dir))


@task
def build():
    """
    Combines usage of build_server and build_client
    """
    build_server()
    build_client()
    copy_cert_to_build()
    configure_allowed_hosts()
    prepare_nginx_conf()


@task
def distribute():
    sudo('rm -rf {}'.format(env.remote_base_dir))
    sudo('mkdir -p {}'.format(env.remote_base_dir))
    sudo('chown -R {}:{} {}'.format(env.user, env.user, env.remote_base_dir))
    put(local_path='{}/*'.format(env.temp_build_dir), remote_path=env.remote_base_dir, use_sudo=True)


@task
def clean_local_temp_dir():
    local('rm -rf {}'.format(env.temp_build_dir))


@task
def prepare_cert():
    """
    Prepare ssl certificate for the web server
    """
    local('openssl genrsa -des3 -out slameter.key 2048')
    local('openssl req -new -key slameter.key -out slameter.csr')
    local('cp -v slameter.{key,original}', shell='/bin/bash')
    local('openssl rsa -in slameter.original -out slameter.key')
    local('rm -v slameter.original')
    local('openssl x509 -req -days 365 -in slameter.csr -signkey slameter.key -out slameter.crt')


@task
def copy_cert_to_build():
    if not (local_path_exists('slameter.key') and local_path_exists('slameter.crt')):
        prepare_cert()

    local('cp slameter.{key,crt} ' + '{}'.format(env.temp_build_dir), shell='/bin/bash')


@task
def prepare_nginx_conf():
    ensure_build_dir_exists()
    local('cp nginx.conf.template {}/nginx.conf'.format(env.temp_build_dir))
    local('sed -i -r -e "s/\{\{base_dir\}\}/%s/g" %s/nginx.conf' % (env.remote_base_dir.replace('/', '\/'), env.temp_build_dir))


@task
def configure_allowed_hosts():
    file_path = '{}/{}/{}.py'.format(env.temp_build_dir, env.server_prod_dir, env.django_production_settings.replace('.', '/'))
    dns_name = prompt("enter remote host's DNS name, or leave empty:")
    hosts = '\'{}\''.format(env.host)
    if dns_name != '':
        hosts += ', \'{}\''.format(dns_name)

    local('sed -i -r -e "s/ALLOWED_HOSTS = \[/ALLOWED_HOSTS = \[%s, /g" %s' % (hosts, file_path))
