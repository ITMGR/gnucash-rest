import unittest
import json
import gnucash_rest
import MySQLdb
import warnings

class ApiTestCase(unittest.TestCase):

    def setUp(self):
        self.app = gnucash_rest.app.test_client()
        self.app.testing = True

    def setup_database(self):
        database = MySQLdb.connect(host='localhost', user='root', passwd='oxford')
        cursor = database.cursor()
        sql = 'CREATE DATABASE test'
        cursor.execute(sql)

    def teardown_database(self):
        warnings.filterwarnings('ignore', category = MySQLdb.Warning)
        database = MySQLdb.connect(host='localhost', user='root', passwd='oxford')
        cursor = database.cursor()
        sql = 'DROP DATABASE IF EXISTS test'
        cursor.execute(sql)

    def get_error_type(self, method, url, data):
        if method is 'get':
            response = self.app.get(url)
        elif method is 'post':
            response = self.app.post(url, data=data)
        else:
            raise ValueError('unknown method in assert_error_type')

        if response.status == '400 BAD REQUEST':
            json_response = json.loads(response.data)
            return json_response['errors'][0]['type']
        else:
            raise ValueError('Non 400 error code: ' + response.status)
 
class RootTestCase(ApiTestCase):

    def test_root(self):
        response = self.app.get('/')
        assert response.data == '"Gnucash REST API"'

class SessionTestCase(ApiTestCase):

    def test_no_session(self):
        data = dict()
        assert self.get_error_type('get', '/accounts', data) == 'SessionDoesNotExist'

    def test_session_no_params(self):
        data = dict()
        assert self.get_error_type('post', '/session', data) == 'InvalidConnectionString'

    def test_session_connection_string(self):
        data = dict(
            connection_string = 'mysql://root:oxford@localhost/test'
        )
        assert self.get_error_type('post', '/session', data) == 'InvalidIsNew'

    def test_session_isnew(self):
        data = dict(
            connection_string = 'mysql://root:oxford@localhost/test',
            is_new='1'
        )
        assert self.get_error_type('post', '/session', data) == 'InvalidIgnoreLock'

    def test_session(self):
        data = dict(
            connection_string = 'mysql://root:oxford@localhost/test',
            is_new = '1',
            ignore_lock = '0'
        )

        # Logs
        # * 11:18:00  WARN <gnc.backend.dbi> [gnc_dbi_unlock()] No lock table in database, so not unlocking it.

        # remove the database in case tests failed previously
        self.teardown_database()

        self.setup_database()

        # 201 CREATED
        response = self.app.post('/session', data=data)
        assert response.data == '"Session started"'

        response = self.app.delete('/session')
        assert response.data == '"Session ended"'

        self.teardown_database()
        

class AccountsTestCase(ApiTestCase):

    def test_accounts_no_session(self):
        assert self.get_error_type('get', '/accounts', dict()) == 'SessionDoesNotExist'

class AccountsSessionTestCase(ApiTestCase):

    def setUp(self):
        self.app = gnucash_rest.app.test_client()
        self.app.testing = True

        # remove the database in case tests failed previously
        self.teardown_database()

        self.setup_database()

        data = dict(
            connection_string = 'mysql://root:oxford@localhost/test',
            is_new = '1',
            ignore_lock = '0'
        )

        response = self.app.post('/session', data=data)
        assert response.data == '"Session started"'

    def tearDown(self):

        response = self.app.delete('/session')
        assert response.data == '"Session ended"'

        self.teardown_database()

    def test_accounts(self):

        response = json.loads(self.app.get('/accounts').data)
        assert response['name'] == 'Root Account'

    # need tests for mangled add accounts

    def test_add_top_account(self):

        response = json.loads(self.app.post('/accounts', data=dict(
            name = 'Test',
            currency  = 'GBP',
            account_type_id = '2'
        )).data)

        assert response['name'] == 'Test'

    def test_add_account_no_data(self):

        data = dict()

        assert self.get_error_type('post', '/accounts', data) == 'NoAccountName'

    def test_add_account_no_currency(self):
        data = dict(
            name = 'Test'
        )
        assert self.get_error_type('post', '/accounts', data) == 'InvalidAccountCurrency'

    def test_add_account_invalid_currency(self):

        data = dict(
            name = 'Test',
            currency  = 'XYZ'
        )

        #response = json.loads(self.app.post('/accounts', data=data).data)
        #print response

        assert self.get_error_type('post', '/accounts', data) == 'InvalidAccountCurrency'

    def test_add_account_invalid_acount_type(self):

        data = dict(
            name = 'Test',
            currency  = 'GBP',
            account_type_id = 'X',
        )

        #response = json.loads(self.app.post('/accounts', data=data).data)
        #print response

        assert self.get_error_type('post', '/accounts', data) == 'InvalidAccountTypeID'

    def test_add_account(self):

        # this is test_accounts
        response = json.loads(self.app.get('/accounts').data)
        assert response['name'] == 'Root Account'

        response = json.loads(self.app.post('/accounts', data=dict(
            name = 'Test',
            currency  = 'GBP',
            account_type_id = '2',
            parent_account_guid = response['guid'],
        )).data)

        assert response['name'] == 'Test'


if __name__ == '__main__':
    unittest.main()