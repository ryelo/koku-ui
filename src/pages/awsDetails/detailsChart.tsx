import { AwsQuery, getQuery } from 'api/awsQuery';
import { AwsReport, AwsReportType } from 'api/awsReports';
import {
  ChartType,
  transformAwsReport,
} from 'components/commonChart/chartUtils';
import { PieChart } from 'components/pieChart/pieChart';
import React from 'react';
import { InjectedTranslateProps, translate } from 'react-i18next';
import { connect } from 'react-redux';
import { awsReportsActions, awsReportsSelectors } from 'store/awsReports';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { formatCurrency, formatValue } from 'utils/formatValue';
import { ComputedAwsReportItem } from 'utils/getComputedAwsReportItems';

interface DetailsChartOwnProps {
  groupBy: string;
  item: ComputedAwsReportItem;
  localGroupBy: string;
}

interface DetailsChartStateProps {
  queryString?: string;
  report?: AwsReport;
  reportFetchStatus?: FetchStatus;
}

interface DetailsChartDispatchProps {
  fetchReport?: typeof awsReportsActions.fetchReport;
}

type DetailsChartProps = DetailsChartOwnProps &
  DetailsChartStateProps &
  DetailsChartDispatchProps &
  InjectedTranslateProps;

class DetailsChartBase extends React.Component<DetailsChartProps> {
  public componentDidMount() {
    const { report, queryString } = this.props;
    if (!report) {
      this.props.fetchReport(AwsReportType.cost, queryString);
    }
  }

  public componentDidUpdate(prevProps: DetailsChartProps) {
    if (prevProps.queryString !== this.props.queryString) {
      this.props.fetchReport(AwsReportType.cost, this.props.queryString);
    }
  }

  public render() {
    const { localGroupBy, report } = this.props;

    const currentData = transformAwsReport(
      report,
      ChartType.monthly,
      localGroupBy
    );
    const legendData = currentData.map(item => ({
      name: item.name.toString() + ' (' + formatCurrency(item.y) + ')',
      symbol: { type: 'square' },
    }));

    if (currentData && currentData.length) {
      return (
        <PieChart
          height={200}
          width={200}
          data={currentData}
          formatDatumValue={formatValue}
          groupBy={localGroupBy}
          legendData={legendData}
        />
      );
    }
    return null;
  }
}

const mapStateToProps = createMapStateToProps<
  DetailsChartOwnProps,
  DetailsChartStateProps
>((state, { groupBy, item, localGroupBy }) => {
  const query: AwsQuery = {
    filter: {
      time_scope_units: 'month',
      time_scope_value: -1,
      resolution: 'monthly',
      limit: 5,
    },
    group_by: { [groupBy]: item.label, [localGroupBy]: '*' },
  };
  const queryString = getQuery(query);
  const report = awsReportsSelectors.selectReport(
    state,
    AwsReportType.cost,
    queryString
  );
  const reportFetchStatus = awsReportsSelectors.selectReportFetchStatus(
    state,
    AwsReportType.cost,
    queryString
  );
  return {
    queryString,
    report,
    reportFetchStatus,
  };
});

const mapDispatchToProps: DetailsChartDispatchProps = {
  fetchReport: awsReportsActions.fetchReport,
};

const DetailsChart = translate()(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(DetailsChartBase)
);

export { DetailsChart, DetailsChartBase, DetailsChartProps };
