import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

export function loadMissionDetailsCyGraph(widget) {
  const container = document.getElementById('cy');
  const mainWrapper = document.querySelector('.cl-main-widget-wrapper');
  const isLightTheme = mainWrapper.classList.contains('lightTheme');
  const isMobile = window.screen.availWidth < 768;
  const graphDir = isMobile ? 'TB' : 'LR';

  const nodeColor = isLightTheme ? '#BEE9F3' : '#2F0426';
  const nodeBorderColor = isLightTheme ? '#F7A1E4' : '#406A8C';
  const nodeLabelColor = isLightTheme ? '#141E28' : '#ffffff';

  const greenClassColor = isLightTheme ? '#219653' : '#6FCF97';
  const redClassColor = isLightTheme ? '#EB5757' : '#EB5757';
  const yellowClassColor = isLightTheme ? '#F2994A' : '#F2994A';

  if (container.style.display === 'block') {
    container.style.display = 'none';
    widget.hideMissionTC();

    return;
  }

  widget.showMissionTC();

  container.style.display = 'block';
  container.innerHTML = '';

  cytoscape.use(dagre);

  const nodes = [];
  const edges = [];

  widget.settings.missions.mission.graph.nodes.forEach(n => {
    nodes.push({ data: { id: n.entityId, label: n.name } });
  });

  widget.settings.missions.mission.graph.graphs[0].edges.forEach(e => {
    if (e.graphEdgeType === 'ROOT') return;
    let classes = '';
    switch (e.graphEdgeType) {
      case 'MUST':
        classes = 'green';
        break;
      case 'SHOULD':
        classes = 'yellow';
        break;
      case 'MUSTNOT':
        classes = 'red';
        break;
    }
    edges.push({ data: { source: e.headEntityId, target: e.tailEntityId, label: e.graphEdgeType.toLowerCase() }, classes: classes });
  });

  // eslint-disable-next-line
    const cy = cytoscape({
    container: document.getElementById('cy'),
    userZoomingEnabled: false,
    boxSelectionEnabled: false,
    autounselectify: true,

    style: [
      {
        selector: 'node',
        style: {
          height: '48px',
          width: '48px',
          'border-color': nodeBorderColor,
          'background-color': nodeColor,
          'border-width': 1,
          label: 'data(label)',
          color: nodeLabelColor,
          'font-size': '12px'
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'taxi',
          width: 1,
          'target-arrow-shape': 'triangle',
          'line-color': greenClassColor,
          'target-arrow-color': greenClassColor,
          'line-style': 'dashed',
          label: 'data(label)',
          color: greenClassColor
        }
      },
      {
        selector: 'node[label]',
        css: {
          'text-margin-y': '-5px'
        }
      },
      {
        selector: 'edge[label]',
        css: {
          label: 'data(label)',
          'text-rotation': 'autorotate',
          'text-margin-x': '-10px',
          'text-margin-y': '-10px',
          'font-size': '12px'
        }
      },
      {
        selector: '.red',
        css: {
          'curve-style': 'taxi',
          width: 1,
          'target-arrow-shape': 'triangle',
          'line-color': redClassColor,
          'target-arrow-color': redClassColor,
          'line-style': 'dashed'
        }
      },
      {
        selector: '.yellow',
        css: {
          'curve-style': 'taxi',
          width: 1,
          'target-arrow-shape': 'triangle',
          'line-color': yellowClassColor,
          'target-arrow-color': yellowClassColor,
          'line-style': 'dashed'
        }
      },
      {
        selector: '.red[label]',
        css: {
          color: redClassColor
        }
      },
      {
        selector: '.yellow[label]',
        css: {
          color: yellowClassColor
        }
      }
    ],

    elements: {
      nodes: nodes,
      edges: edges
    },

    layout: {
      name: 'dagre',
      directed: true,
      rankDir: graphDir,
      padding: 30,
      fit: true,
      spacingFactor: 1.5
    }
  });

  cy.on('tap', 'node', function (evt) {
    const node = evt.target;
    widget.loadMissionDetails(widget.settings.missions.mission, null, node.id());
  });
}

export async function loadMissionMapGraph(widget) {
  const container = document.getElementById('cy-map');
  const mainWrapper = document.querySelector('.cl-main-widget-wrapper');
  const isLightTheme = mainWrapper.classList.contains('lightTheme');
  const isMobile = window.screen.availWidth < 768;

  const stageIcons = [
    'https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/icons/book.png',
    'https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/icons/bottle.png',
    'https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/icons/rocket(2).svg',
    'https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/icons/prize-3.png',
    'https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/icons/prize-2.png',
    'https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/icons/award%20(2).svg'
  ];

  const itemBgEl = document.querySelector('.cl-main-widget-missions-map-graph-item-bg');
  const style = window.getComputedStyle(itemBgEl, false);

  const starEl3 = document.querySelector('.cl-main-widget-missions-map-graph-item-star-3');
  const starEl2 = document.querySelector('.cl-main-widget-missions-map-graph-item-star-2');
  const starEl1 = document.querySelector('.cl-main-widget-missions-map-graph-item-star-1');

  let itemBgSrc = style.backgroundImage.slice(4, -1).replace(/"/g, '');
  if (!itemBgSrc || itemBgSrc[0] === 'f') {
    itemBgSrc = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/map-item-bg.png';
  }

  let starEl3Src = window.getComputedStyle(starEl3, false).backgroundImage.slice(4, -1).replace(/"/g, '');
  let starEl2Src = window.getComputedStyle(starEl2, false).backgroundImage.slice(4, -1).replace(/"/g, '');
  let starEl1Src = window.getComputedStyle(starEl1, false).backgroundImage.slice(4, -1).replace(/"/g, '');

  if (starEl3Src[0] === 'f') {
    starEl3Src = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/rate3.svg';
    starEl2Src = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/rate2.svg';
    starEl1Src = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/rate1.svg';
  }

  const achIds = widget.settings.missions.mission.graph.nodes.map(n => n.entityId);

  const subarray = [];
  for (let i = 0; i < Math.ceil(achIds.length / 20); i++) {
    subarray[i] = achIds.slice((i * 20), (i * 20) + 20);
  }

  const statusesSubarray = [];

  for (let i = 0; i < subarray.length; i++) {
    const statuses = await widget.settings.lbWidget.getMemberAchievementsOptInStatuses(subarray[i]);
    statusesSubarray.push(statuses);
  }

  const statuses = statusesSubarray.flat();

  container.innerHTML = '';

  cytoscape.use(dagre);

  const nodes = [];
  const edges = [];

  widget.settings.missions.mission.graph.nodes.forEach((n) => {
    let src = stageIcons[Math.floor(Math.random() * 6)];
    if (n.includes && n.includes.iconLink) src = n.includes.iconLink;

    let starSrc = 'none';
    let labelBg = '#3b4284';
    let opacity = 1;
    const statusIdx = statuses.findIndex(a => a.entityId === n.entityId);
    if (statusIdx !== -1) {
      if (statuses[statusIdx].percentageComplete >= 33 && statuses[statusIdx].percentageComplete < 66) starSrc = starEl1Src;
      if (statuses[statusIdx].percentageComplete >= 66 && statuses[statusIdx].percentageComplete < 100) starSrc = starEl2Src;
      if (statuses[statusIdx].percentageComplete === 100) starSrc = starEl3Src;

      if (statuses[statusIdx].percentageComplete === 100) labelBg = '#4476f1';
      if (statuses[statusIdx].percentageComplete > 0 && statuses[statusIdx].percentageComplete < 100) labelBg = '#e33568';

      if (statuses[statusIdx].percentageComplete === 0) opacity = 0.5;
    }

    nodes.push({ data: { id: n.entityId, label: n.name, labelBg: labelBg, opacity: opacity, images: [itemBgSrc, src, starSrc, 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/map-item-bottom.svg'] } });
  });

  widget.settings.missions.mission.graph.graphs[0].edges.forEach(e => {
    if (e.graphEdgeType === 'ROOT') return;
    let classes = '';
    switch (e.graphEdgeType) {
      case 'MUST':
        classes = 'green';
        break;
      case 'SHOULD':
        classes = 'yellow';
        break;
      case 'MUSTNOT':
        classes = 'red';
        break;
    }
    edges.push({ data: { source: e.headEntityId, target: e.tailEntityId, label: e.graphEdgeType.toLowerCase() }, classes: classes });
  });

  const backgroundColor = isLightTheme ? '#EDF3F7' : '#0f1921';
  const nodeLabelColor = isLightTheme ? '#223241' : '#ffffff';
  const edgeLineColor = isLightTheme ? '#B9CEDF' : '#304F69';
  const graphDir = isMobile ? 'TB' : 'LR';

  const cy = cytoscape({
    container: document.getElementById('cy-map'),
    userZoomingEnabled: false,
    boxSelectionEnabled: false,
    autounselectify: true,
    zoom: 1,

    style: [
      {
        selector: 'node',
        style: {
          height: '90px',
          width: '90px',
          'background-color': backgroundColor,
          'background-image': 'data(images)',
          'background-fit': 'none cover none none',
          'background-clip': 'none node none none',
          'bounds-expansion': 60,
          'background-image-containment': 'over over over over',
          'background-repeat': 'no-repeat',
          label: 'data(label)',
          color: nodeLabelColor,
          'font-size': '12px',
          'text-valign': 'bottom',
          'text-halign': 'center'
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'unbundled-bezier',
          width: 5,
          'line-color': edgeLineColor,
          'line-style': 'dashed',
          'line-dash-pattern': [0, 14],
          'line-cap': 'round'
        }
      },
      {
        selector: 'node[label]',
        css: {
          'text-margin-y': '25px',
          'text-background-padding': '3px',
          'text-background-color': 'data(labelBg)',
          'text-background-shape': 'roundrectangle',
          'text-background-opacity': 'data(opacity)'
        }
      }
    ],

    elements: {
      nodes: nodes,
      edges: edges
    },

    layout: {
      name: 'dagre',
      directed: true,
      rankDir: graphDir,
      padding: 20,
      fit: true,
      spacingFactor: 1.3
    }
  });

  cy.on('tap', 'node', function (evt) {
    const node = evt.target;
    widget.loadMissionDetails(widget.settings.missions.mission, null, node.id());
  });
}
