import open3d as o3d
import numpy as np
import matplotlib.pyplot as plt

# 读取点云文件
def read_point_cloud(file_path):
    try:
        pcd = o3d.io.read_point_cloud(file_path)
        if not pcd.has_points():
            print("未成功读取到点云数据，请检查文件路径与格式。")
            return None
        return pcd
    except Exception as e:
        print(f"读取点云文件时出现错误: {e}")
        return None


# 体素滤波
def voxel_downsample(pcd, voxel_size):
    downsampled_pcd = pcd.voxel_down_sample(voxel_size)
    return downsampled_pcd


# 根据密度给点云赋颜色
def colorize_point_cloud_by_density(pcd, radius=2):
    points = np.asarray(pcd.points)
    pcd_tree = o3d.geometry.KDTreeFlann(pcd)
    densities = []
    for point in points:
        [_, idx, _] = pcd_tree.search_radius_vector_3d(point, radius)
        densities.append(len(idx))
    densities = np.array(densities)

    # 归一化密度并映射到颜色
    min_density = np.min(densities)
    max_density = np.max(densities)
    normalized_densities = (densities - min_density) / (max_density - min_density)
    colors = plt.cm.hot(normalized_densities)[:, :3]

    # 将颜色赋值给点云
    pcd.colors = o3d.utility.Vector3dVector(colors)
    return pcd

def colorize_point_cloud_single_color(pcd, color):
    num_points = len(pcd.points)
    # 创建颜色数组，每个点的颜色都相同
    colors = np.tile(np.array(color), (num_points, 1))
    pcd.colors = o3d.utility.Vector3dVector(colors)
    return pcd


def visualize_point_cloud(pcd, point_size, window_name):
    vis = o3d.visualization.Visualizer()
    vis.create_window(window_name=window_name)
    vis.add_geometry(pcd)
    render_option = vis.get_render_option()
    render_option.point_size = point_size
    render_option.background_color = np.array([0, 0, 0])
    vis.run()
    vis.destroy_window()


if __name__ == "__main__":
    file_path = "fd.pcd"
    #体素滤波半径
    voxel_size = 0.002
    # 点的大小
    point_size = 1.0
    #窗口名称
    window_name = "伦敦街景"
    pcd = read_point_cloud(file_path)
    if pcd is not None:
        downsampled_pcd = voxel_downsample(pcd, voxel_size)
        # 根据密度赋颜色
        colored_pcd = colorize_point_cloud_by_density(downsampled_pcd)

        #设置一个颜色
        # single_color = [1, 0, 0]
        # colored_pcd = colorize_point_cloud_single_color(downsampled_pcd, single_color)

        # 可视化
        visualize_point_cloud(colored_pcd, point_size, window_name)
