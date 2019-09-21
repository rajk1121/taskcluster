import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import RefParser from 'json-schema-ref-parser';
import { string } from 'prop-types';
import Spinner from '@mozilla-frontend-infra/components/Spinner';
import { withStyles } from '@material-ui/core/styles';
import Table from 'react-schema-viewer/lib/SchemaTable';
import cloneDeep from 'lodash.clonedeep';
import jsonSchemaDraft06 from 'ajv/lib/refs/json-schema-draft-06.json';
import jsonSchemaDraft07 from 'ajv/lib/refs/json-schema-draft-07.json';
import ErrorPanel from '../ErrorPanel';
import { THEME } from '../../utils/constants';
import references from '../../../../generated/references.json';

// Local copies of the json-schemas schemas, since TC schemas $refer to these
const EXTERNAL_SCHEMAS = [jsonSchemaDraft06, jsonSchemaDraft07].reduce(
  (schemas, schema) => ({ ...schemas, [schema.$id]: schema }),
  {}
);

@withRouter
@withStyles(
  theme => {
    const borderColor =
      theme.palette.type === 'dark'
        ? THEME.TEN_PERCENT_WHITE
        : THEME.TEN_PERCENT_BLACK;

    return {
      bootstrapTable: {
        fontSize: 16,
        overflowX: 'auto',
        '& pre': {
          background:
            theme.palette.type === 'dark'
              ? `${THEME.TEN_PERCENT_WHITE} !important`
              : `${THEME.TEN_PERCENT_BLACK} !important`,
        },
        /* eslint-disable no-dupe-keys */
        // Copied from https://github.com/twbs/bootstrap/blob/f7e8445f72875a49a909dc0af8e4cf43f19f535e/dist/css/bootstrap.css#L1515-L1536
        '& .table': {
          width: '100%',
          marginBottom: '1rem',
        },
        '& .table th, & .table td': {
          padding: '0.75rem',
          verticalAlign: 'top',
          borderTop: `1px solid ${borderColor}`,
        },
        '& .table thead th': {
          verticalAlign: 'bottom',
          borderBottom: `2px solid ${borderColor}`,
          '& table tbody + tbody': {
            borderTop: `2px solid ${borderColor}`,
          },
        },
        '& .table': {
          width: '100%',
          marginBottom: '1rem',
        },
        '& .table th, & .table td': {
          padding: '0.75rem',
          verticalAlign: 'top',
          borderTop: `1px solid ${borderColor}`,
        },
        '& .table thead th': {
          verticalAlign: 'bottom',
          borderBottom: `2px solid ${borderColor}`,
          '& table tbody + tbody': {
            borderTop: `2px solid ${borderColor}`,
          },
        },
        // Copied from https://github.com/twbs/bootstrap/blob/f7e8445f72875a49a909dc0af8e4cf43f19f535e/dist/css/bootstrap.css#L1547-L1559
        '& .table-bordered': {
          border: `1px solid ${borderColor}`,
        },
        '& .table-bordered th': {
          border: `1px solid ${borderColor}`,
        },
        '& .table-bordered thead th, & .table-bordered thead td': {
          borderBottomWidth: 2,
        },
        /* eslint-enable no-dupe-keys */
      },
    };
  },
  { withTheme: true }
)
/**
 * Display a SchemaTable
 */
export default class SchemaTable extends Component {
  static propTypes = {
    // The $id of the schema to render
    schema: string.isRequired,
  };

  state = {
    schema: null,
    error: null,
  };

  async componentDidMount() {
    const { schema } = this.props;

    if (!this.state.schema && schema) {
      try {
        const schemaContent = await this.getSchemaContent(schema);

        this.setState({
          schema: schemaContent,
        });
      } catch (error) {
        this.setState({ error });
      }
    }
  }

  readReference(file) {
    const external = EXTERNAL_SCHEMAS[`${file.url}#`];

    if (external) {
      return external;
    }

    const { protocol, hostname, pathname } = new URL(file.url);

    // since json-schema-ref-parser uses the window's location for relative
    // URIs, only map those to our local schema list
    if (
      protocol !== window.location.protocol ||
      hostname !== window.location.hostname
    ) {
      throw new Error(`External schema ${file.url} not available`);
    }

    const schemaId = `${pathname}#`;
    const schema = references.find(({ content }) => content.$id === schemaId);

    if (!schema) {
      throw new Error(`Schema ${file.url} not found`);
    }

    return schema.content;
  }

  async getSchemaContent(schemaPath) {
    // json-schema-ref-parser uses the window's location for relative URIs, so
    // we adapt the path to match..
    const fullSchemaPath = new URL(schemaPath, window.location.href);
    const schema = cloneDeep(
      this.readReference({ url: fullSchemaPath.toString() })
    );

    if (!schema) {
      throw new Error(`Cannot find ${schemaPath}.`);
    }

    await RefParser.dereference(schema.$id, schema, {
      resolve: {
        http: false,
        file: false,
        any: {
          order: 1,
          canRead: true,
          read: file => this.readReference(file),
        },
      },
      dereference: {
        circular: 'ignore',
      },
    });

    return schema;
  }

  render() {
    const { classes, theme } = this.props;
    const { error, schema } = this.state;
    const headerBackground =
      theme.palette.type === 'light' ? 'rgb(240,240,240)' : 'rgb(43,57,69)';

    if (error) {
      return <ErrorPanel error={error} />;
    }

    return schema ? (
      <div className={classes.bootstrapTable}>
        <Table headerBackgroundColor={headerBackground} schema={schema} />
      </div>
    ) : (
      <Spinner loading />
    );
  }
}
