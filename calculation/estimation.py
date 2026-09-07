import numpy as np
import pandas as pd

np.random.seed(42)
n = 5000

# ---- Constants from the PDF ----
BRICK_VOL_CLEAN = (9*4.5*3)/1728          # 0.0703 ft3
BRICK_VOL_MORTARED = (9.5*5*3.5)/1728     # 0.0962 ft3
CONCRETE_GRADES = {
    'M7.5': (1, 4, 8, 13),
    'M10':  (1, 3, 6, 10),
    'M15':  (1, 2, 4, 7),
    'M20':  (1, 1.5, 3, 5.5),
    'M25':  (1, 1, 2, 4),
    'M30':  (1, 0.75, 1.5, 3.25),
}
QUALITY_RATES = {'Economy': 1600, 'Standard': 2100, 'Premium': 2850, 'Luxury': 3800}

# ---- Inputs ----
floor_area = np.random.uniform(600, 6000, n)
num_floors = np.random.randint(1, 5, n)
built_up_area = floor_area * num_floors

quality = np.random.choice(list(QUALITY_RATES.keys()), n, p=[0.3, 0.35, 0.25, 0.1])
base_rate = np.array([QUALITY_RATES[q] for q in quality])
region_multiplier = np.random.uniform(0.85, 1.2, n)
market_noise = np.random.normal(0, 0.03, n)
total_cost = built_up_area * base_rate * region_multiplier * (1 + market_noise)

# Brickwork
wall_area_ratio = np.random.uniform(0.55, 0.85, n)
gross_wall_area = floor_area * num_floors * wall_area_ratio
door_window_pct = np.random.uniform(0.08, 0.18, n)
net_wall_area = gross_wall_area * (1 - door_window_pct)
wall_thickness_in = np.random.choice([4.5, 9], n, p=[0.3, 0.7])
wall_volume = net_wall_area * (wall_thickness_in / 12)
brick_wastage_pct = np.random.uniform(3, 8, n)
base_bricks = np.ceil(wall_volume / BRICK_VOL_MORTARED)
total_bricks = base_bricks * (1 + brick_wastage_pct / 100)
wet_mortar_brick = np.clip(wall_volume - base_bricks * BRICK_VOL_CLEAN, 0, None)
dry_mortar_brick = wet_mortar_brick * 1.33
cement_bags_brick = np.ceil((dry_mortar_brick * (1/7)) / 1.25)
sand_vol_brick = dry_mortar_brick * (6/7)

# Concrete / RCC
slab_thickness_in = np.random.uniform(4.5, 6, n)
concrete_volume_wet = floor_area * num_floors * (slab_thickness_in / 12)
dry_volume_concrete = concrete_volume_wet * 1.54
grade_choice = np.random.choice(list(CONCRETE_GRADES.keys()), n, p=[0.05,0.1,0.15,0.5,0.15,0.05])
cement_part = np.array([CONCRETE_GRADES[g][0] for g in grade_choice])
sand_part   = np.array([CONCRETE_GRADES[g][1] for g in grade_choice])
agg_part    = np.array([CONCRETE_GRADES[g][2] for g in grade_choice])
tot_part    = np.array([CONCRETE_GRADES[g][3] for g in grade_choice])
cement_bags_concrete = np.ceil((dry_volume_concrete * cement_part/tot_part)/1.25)
sand_vol_concrete = dry_volume_concrete * sand_part/tot_part
agg_vol_concrete = dry_volume_concrete * agg_part/tot_part
steel_pct = np.random.uniform(0.008, 0.025, n)
steel_weight_concrete = concrete_volume_wet * 0.028317 * 7850 * steel_pct
water_liters = cement_bags_concrete * 28

# Plaster
plaster_wall_area = gross_wall_area * np.random.uniform(1.6, 2.0, n)
plaster_thickness_mm = np.random.choice([12, 15, 6, 20], n, p=[0.5, 0.15, 0.15, 0.2])
wet_vol_plaster = plaster_wall_area * (plaster_thickness_mm/304.8)
dry_vol_plaster = wet_vol_plaster * 1.33
plaster_total_parts = np.where(plaster_thickness_mm == 20, 5, 7)  # ext 1:4, others 1:6
cement_bags_plaster = np.ceil((dry_vol_plaster * (1/plaster_total_parts))/1.25)
sand_vol_plaster = dry_vol_plaster * ((plaster_total_parts-1)/plaster_total_parts)

# Flooring
tile_size_choice = np.random.choice(['1x1','2x2','2x4'], n, p=[0.2,0.6,0.2])
tile_area_map = {'1x1':1,'2x2':4,'2x4':8}
tiles_per_box_map = {'1x1':10,'2x2':4,'2x4':2}
tile_area = np.array([tile_area_map[t] for t in tile_size_choice])
tiles_per_box = np.array([tiles_per_box_map[t] for t in tile_size_choice])
flooring_area_total = floor_area * num_floors
base_tiles = np.ceil(flooring_area_total/tile_area)
total_tiles = base_tiles * 1.08
boxes = np.ceil(total_tiles/tiles_per_box)
adhesive_bags = np.ceil(flooring_area_total/40)
epoxy_grout_kg = np.ceil(flooring_area_total/60)

# Aggregates
total_cement_bags = cement_bags_brick + cement_bags_concrete + cement_bags_plaster
total_sand_volume = sand_vol_brick + sand_vol_concrete + sand_vol_plaster

df = pd.DataFrame({
    'floor_area_sqft': floor_area, 'num_floors': num_floors, 'built_up_area_sqft': built_up_area,
    'quality': quality, 'region_multiplier': region_multiplier,
    'wall_area_ratio': wall_area_ratio, 'door_window_pct': door_window_pct,
    'wall_thickness_in': wall_thickness_in, 'brick_wastage_pct': brick_wastage_pct,
    'slab_thickness_in': slab_thickness_in, 'concrete_grade': grade_choice, 'steel_pct': steel_pct,
    'plaster_thickness_mm': plaster_thickness_mm, 'tile_size': tile_size_choice,
    'total_cost': total_cost, 'total_cement_bags': total_cement_bags, 'total_sand_volume_ft3': total_sand_volume,
    'total_bricks': total_bricks, 'total_steel_weight_kg': steel_weight_concrete,
    'total_tiles': total_tiles, 'total_boxes': boxes, 'adhesive_bags': adhesive_bags, 'epoxy_grout_kg': epoxy_grout_kg,
    'aggregate_volume_ft3': agg_vol_concrete, 'water_liters': water_liters
})
print(df.describe().T)
print(df.isna().sum().sum(), "NaNs")
print((df.select_dtypes(include=[np.number]) < 0).sum().sum(), "negative values")

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_absolute_percentage_error
import xgboost as xgb

feature_cols = ['floor_area_sqft','num_floors','built_up_area_sqft','quality','region_multiplier',
                 'wall_area_ratio','door_window_pct','wall_thickness_in','brick_wastage_pct',
                 'slab_thickness_in','concrete_grade','steel_pct','plaster_thickness_mm','tile_size']
cat_cols = ['quality','concrete_grade','tile_size']
num_cols = [c for c in feature_cols if c not in cat_cols]

X = df[feature_cols]
y_cost = df['total_cost']

X_train, X_test, y_train, y_test = train_test_split(X, y_cost, test_size=0.2, random_state=42)

pre = ColumnTransformer([
    ('num', StandardScaler(), num_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols)
])

models = {
    'RandomForest': RandomForestRegressor(n_estimators=300, max_depth=None, random_state=42, n_jobs=-1),
    'GradientBoosting': GradientBoostingRegressor(n_estimators=300, random_state=42),
    'XGBoost': xgb.XGBRegressor(n_estimators=400, max_depth=6, learning_rate=0.05, random_state=42, n_jobs=-1)
}

for name, m in models.items():
    pipe = Pipeline([('pre', pre), ('model', m)])
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)
    r2 = r2_score(y_test, pred)
    mae = mean_absolute_error(y_test, pred)
    mape = mean_absolute_percentage_error(y_test, pred)
    print(f"{name}: R2={r2:.4f} MAE={mae:,.0f} MAPE={mape*100:.2f}%")
