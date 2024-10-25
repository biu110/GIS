require([
  "esri/config",
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/geometry/Polygon",
  "esri/geometry/geometryEngine",
  "esri/widgets/Home",
], function (esriConfig, Map, SceneView, SceneLayer, FeatureLayer, Graphic,
  GraphicsLayer, Polygon, geometryEngine, Home) {

  esriConfig.apiKey = "AAPK816905600159480ca9b2abfe361e6207iPYVIdXZ7gXCjVQi066hTutMI40_AoNTxhbV_ORI2IGq6IHV5UXSPhF8UH2WAzi1";

  const map = new Map({
    basemap: "arcgis/navigation", 
    ground: "world-elevation"
  });
  
  const view = new SceneView({
    container: "viewDiv",
    map: map,
    center: [116.3912757, 39.906217], 
    zoom: 2,
  });
  
  // Add a scene layer
  const homeBtn = new Home({
    view: view
  });
  // Add the home button to the top left corner of the view
  view.ui.add(homeBtn, "top-left");

  //let layer; // 用于存储场景图层
  //let layerVisible = true;

  view.ui.add("loadscene", "top-right"); // Add zoom widget to the view
  const loadscene = document.getElementById("loadscene");
  loadscene.addEventListener("click", function () {
    const layer = new SceneLayer({
      url: "https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Building_Montreal/SceneServer/",
      popupEnabled: true,
        
    });
    map.add(layer)
    view.goTo({
      center: [-73.55382, 45.50972,],
      zoom: 14,
    }).catch(function (error) {
      if (error.name != "AbortError") {
        console.error(error);
      }
    });
  });
  view.ui.add("loadfeature", "top-right"); 
  
  let featureLayerVisible = false; // 控制要素图层的可见性
  let provincelayer; // 存储加载的要素图层

  const loadfeature = document.getElementById("loadfeature");
  loadfeature.addEventListener("click", function () {
    if (!featureLayerVisible) {      // 如果要素图层不可见，加载并显示
      provincelayer = new FeatureLayer({
        url: "https://services3.arcgis.com/KE5B4kx458aPGuKZ/arcgis/rest/services/%E8%9E%8D%E5%90%88%E5%90%8E/FeatureServer",
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-fill", // Setting it as a fill symbol for polygons
            color: [227, 139, 79, 0.8], // Adjust color as needed
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          }
        },
        labelingInfo: [{
          labelExpressionInfo: {
            expression: "$feature.NAME" 
          },
          symbol: {
            type: "text",  //标签的文本符号类型
            color: "black",
            haloColor: "white",
            haloSize: "1px",
            font: {        //自定义字体样式
              size: 12,
              family: "Arial",
              weight: "bold"
            }
          },
          labelPlacement: "above-center" 
        }]
      });
      map.add(provincelayer);
      featureLayerVisible = true;    // 设置为可见
    } else {                        
      map.remove(provincelayer);    // 如果要素图层可见，则移除
      featureLayerVisible = false;  // 设置为不可见
    }
    view.goTo({
      center: [116.3886714259927, 40.0573076030156],
      zoom: 4,
    }).catch(function (error) {
      if (error.name != "AbortError") {
        console.error(error);
      }
    });
  });

  view.ui.add("readjson", "top-right"); 
  let jsonLayerVisible = false; // 控制要素图层的可见性
  let jsonlayer; // 存储加载的要素图层
  let polygonGraphic; // 存储加载的面状图层
  const readjson = document.getElementById("readjson");
  readjson.addEventListener("click", function () {
    if (!jsonLayerVisible) {
      // 如果要素图层不可见，加载并显示
      jsonlayer = new GraphicsLayer({});
      map.add(jsonlayer);
      const polygon = new Polygon({
        "type": "polygon",
        "hasZ": true,
        "rings": [
          [
            [117.2196502920001, 32.101677358000074, 0],
            [117.22092140200004, 32.101810522000051, 0],
            [117.22224093400007, 32.101713675000042, 0],
            [117.22273727200002, 32.10079363400007, 0],
            [117.22282201300004, 32.099546736000036, 0],
            [117.22248305100004, 32.098711436000031, 0],
            [117.22130878700011, 32.098433002000036, 0],
            [117.22024347700005, 32.098445108000078, 0],
            [117.21954134000009, 32.098554060000026, 0],
            [117.21899657900008, 32.099231985000074, 0],
            [117.21912974300005, 32.100285190000079, 0],
            [117.2196502920001, 32.101677358000074, 0]
          ],
          [
            [117.22041295800011, 32.101096279000046, 0],
            [117.22000136100007, 32.099994651000031, 0],
            [117.22021926500008, 32.099256197000045, 0],
            [117.22150248000003, 32.099159351000026, 0],
            [117.22222882900007, 32.099340938000068, 0],
            [117.22227725200003, 32.100478883000051, 0],
            [117.22173249100001, 32.101168914000027, 0],
            [117.22041295800011, 32.101096279000046, 0]
          ]
        ],
        "spatialReference": { "wkid": 4326 }
      })
      const fillSymbol = {
        type: "simple-fill", // autocasts as new SimpleFillSymbol()
        color: [0, 255, 0, 0.5],
        outline: {
          // autocasts as new SimpleLineSymbol()
          color: [255, 255, 255],
          width: 1
        },
        
      };
      polygonGraphic = new Graphic({
        geometry: polygon,
        symbol: fillSymbol,
      });
      jsonlayer.add(polygonGraphic);
      jsonLayerVisible = true;
    } else { // 如果要素图层可见，则移除
      map.remove(jsonlayer);
      jsonLayerVisible = false; // 设置为不可见
    }
    
    view.goTo({
      //target: polygonGraphic.geometry,  
      position: {
        x:117.22, 
        y:32.10,
        z: 5000  
      }
    }).catch(function (error) {
      if (error.name != "AbortError") {
        console.error(error);
      }
    });
  });

  view.ui.add("loadfarm", "top-right"); // Add zoom widget to the view
  let farmlandLayerVisible = false; // 控制要素图层的可见性
  let farmlandslayer; // 存储加载的要素图层
  const loadfarm = document.getElementById("loadfarm");
  loadfarm.addEventListener("click", function () {
    if (!farmlandLayerVisible) {
      farmlandslayer = new FeatureLayer({
        url: "https://services3.arcgis.com/KE5B4kx458aPGuKZ/arcgis/rest/services/testGDB/FeatureServer/2",
        renderer: {
          type: "simple", // Set the renderer type to "simple"
          symbol: {
            type: "simple-fill", // Setting it as a fill symbol for polygons
            color: [227, 139, 79, 0.8], // Adjust color as needed
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          }
        }
      })
      map.add(farmlandslayer);
      farmlandLayerVisible = true;
    } else {
      map.remove(farmlandslayer);
      farmlandLayerVisible = false; // 设置为不可见
    }
    view.goTo({
      position: {
        x:117.22, 
        y:32.10,
        z: 5000  
      }
    }).catch(function (error) {
      if (error.name != "AbortError") {
        console.error(error);
      }
    })
  });
  view.ui.add("analysis", "top-right")
  let graphicsLayer
  const analysis = document.getElementById("analysis")
  analysis.addEventListener("click", function () {
    if (!polygonGraphic || !polygonGraphic.geometry) {
      console.error("Please click '读取json' to load the polygon data first.")
      return;
    }
    if (!farmlandslayer) {
      console.error("Please load the farm layer first by clicking '添加农田'")
      return;
    }

    //两次异步，第一次异步先加载农田图层并进行查询，第二次异步计算交集并显示
    farmlandslayer.load().then(() => {
      const query = farmlandslayer.createQuery();
      query.objectIds = ["1"];
      query.returnGeometry = true;
      
      // 
      farmlandslayer.queryFeatures(query).then((result) => {
        if (result.features.length === 0) {
          console.error("No features found with OBJECTID=1.");
          return;
        }
        const farmlandGeometry = result.features[0].geometry; //返回第一个结果的值
        // 计算交集
        const intersectedGeometry = geometryEngine.intersect(farmlandGeometry, polygonGraphic.geometry);
        if (!intersectedGeometry) {
          console.error("No intersection found.");
          return;
        }
        const square_meters = geometryEngine.geodesicArea(intersectedGeometry, "square-meters"); 
        alert(`Area of intersection: ${square_meters} squaremeters.`);
        
        const intersectionGraphic = new Graphic({
          geometry: intersectedGeometry,   // 直接使用交集的几何图形
          symbol: {
            type: "simple-fill",
            color: [255, 0, 0, 0.5],       //红色填充表示交集
            outline: { color: [255, 255, 255], width: 1 }
          },
          "spatialReference": { "wkid": 4527 },
        });
        // 确保 graphicsLayer 已定义
        if (!graphicsLayer) {
          graphicsLayer = new GraphicsLayer();
          map.add(graphicsLayer);          //如果还没添加到地图就添加
        }
        graphicsLayer.add(intersectionGraphic);
        console.log("Overlay analysis complete, intersection displayed.");
      }).catch((error) => {
        console.error("Query failed:", error);
      });
    }).catch((loadError) => {
      console.error("Layer failed to load:", loadError);
    });
  });
});