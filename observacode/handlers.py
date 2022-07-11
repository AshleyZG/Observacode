from genericpath import exists
import json
from lib2to3.pgen2.token import NEWLINE
import os
import this
from unittest.mock import patch
from urllib.parse import urlparse
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

DATA_PATH = "/Users/gezhang/Research/src/Observecode-simulation/toy-dataset/overcode/ac10_9_11_real_time"

OVERCODE_PATH = "/Users/gezhang/Research/src/overcode"

FUNCTION_NAME = "solution"

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def post(self):
        body = json.loads(self.request.body)
        solutions = body['solutions']

        if not os.path.exists(DATA_PATH):
            os.mkdir(DATA_PATH)
            os.mkdir(os.path.join(DATA_PATH, 'data'))

        files = os.listdir(os.path.join(DATA_PATH, 'data'))

        for name in solutions:
            uname = name.split('@')[0]
            for idx, solution in enumerate(solutions[name]):
                fname = '{}_{}.py'.format(uname, idx)
                if not fname in files:
                    lines = solution.split('\n')
                    new_lines = ['def solution():']+['#'+l if l.startswith('print') else '    '+l for l in lines]+['    return counts']
                    with open(os.path.join(DATA_PATH, 'data', fname), 'w') as fout:
                        fout.write('\n'.join(new_lines))

        data = {}
        self.finish(json.dumps({
            "data": data
        }))

class OverCodeRouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        with open(os.path.join(DATA_PATH, 'output', 'solutions.json'), 'r') as f:
            data = json.load(f)

        self.finish(json.dumps({
            "data": data
        }))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "observacode", "get_example")
    overcode_route_pattern = url_path_join(base_url, "observacode", "get_overcode_results")
    handlers = [(route_pattern, RouteHandler), (overcode_route_pattern, OverCodeRouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
